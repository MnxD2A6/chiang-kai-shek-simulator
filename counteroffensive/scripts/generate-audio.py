"""Reproducible original tactical SFX. Python + numpy + scipy; no external samples."""
from pathlib import Path
import hashlib, json, wave
import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'audio'
RNG = np.random.default_rng(180014)


def timeline(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def noise(seconds, low=30, high=8000):
    values = RNG.normal(0, 1, round(seconds * RATE))
    result = sosfilt(butter(3, [low, high], btype='bandpass', fs=RATE, output='sos'), values)
    return result / max(.01, np.std(result))


def chirp(t, start, end, decay):
    return np.sin(2 * np.pi * (start*t + (end-start)*t*t/(2*max(t[-1], .01)))) * np.exp(-t/decay)


def boom(seconds=1.5, heavy=False):
    t = timeline(seconds)
    signal = .42*noise(seconds, 35, 260)*np.exp(-t/.38)
    signal += .27*noise(seconds, 600, 7000)*np.exp(-t/.028)
    signal += .16*noise(seconds, 170, 1600)*np.exp(-t/.19)
    signal += .22*chirp(t, 110 if heavy else 180, 35, .18)
    for at in [.08, .14, .26, .43]:
        k = round(at*RATE)
        signal[k:] += .035*noise(seconds-at, 300, 3000)[:len(t)-k]*np.exp(-np.maximum(0,t[k:]-at)/.085)
    return signal


def splash(seconds=.95):
    t = timeline(seconds)
    return .55*noise(seconds, 900, 10500)*(1-np.exp(-t/.008))*np.exp(-t/.21) + .24*noise(seconds, 80, 650)*np.exp(-t/.24)


def musical(notes, seconds, interval=.14, decay=.25):
    t = timeline(seconds)
    result = np.zeros(len(t))
    for i, frequency in enumerate(notes):
        at = i*interval
        local = np.maximum(0, t-at)
        tone = np.sin(2*np.pi*frequency*local) + .18*np.sin(2*np.pi*frequency*2*local)
        result += np.where(t>=at, tone*np.exp(-local/decay), 0) * .24
    return result


def build():
    clips = {}
    t = timeline(.13)
    clips['select'] = .5*noise(.13, 900, 7000)*np.exp(-t/.009) + .13*chirp(t, 1300, 800, .035)
    clips['order'] = musical([740, 1110], .32, .075, .07)
    t = timeline(.38)
    clips['rifle'] = .5*noise(.38, 1000, 9500)*np.exp(-t/.012)+.3*noise(.38, 120, 1000)*np.exp(-t/.065)
    clips['gun'] = boom(.65)*.85
    t = timeline(1.15)
    clips['missile'] = noise(1.15, 200, 7000)*(.3+.15*np.sin(t*11))*np.minimum(1,t/.055)*np.exp(-t/.34)+.12*chirp(t,130,470,.5)
    clips['impact'] = boom(.48)*.7
    clips['explosion'] = boom(1.65, True)
    clips['water'] = splash(1.1)
    t = timeline(.65)
    clips['intercept'] = .55*noise(.65, 700, 12000)*np.exp(-t/.055)+.2*chirp(t,1900,180,.07)
    clips['sink'] = boom(2.3, True)
    water = splash(1.8)
    clips['sink'][round(.5*RATE):] += .22*water[:len(clips['sink'])-round(.5*RATE)]
    t = timeline(.95)
    gate = ((t<.27)|((t>.4)&(t<.69))).astype(float)
    clips['warning'] = .35*(np.sin(2*np.pi*680*t)+.3*np.sin(2*np.pi*1020*t))*gate
    clips['capture'] = musical([523.25,659.25,783.99], .9, .12, .22)
    clips['victory'] = musical([523.25,659.25,783.99,1046.5], 1.8, .18, .36)
    clips['defeat'] = musical([392,329.63,261.63], 1.6, .19, .4)
    t = timeline(1.4)
    engine = .2*np.sin(2*np.pi*60*t)+.13*np.sin(2*np.pi*120*t)+.09*np.sin(2*np.pi*180*t)
    clips['engine'] = engine*(.8+.2*np.sin(2*np.pi*5*t)) + .19*noise(1.4, 90, 950)
    t = timeline(1.4)
    foot = np.zeros(len(t))
    for at in [0,.35,.7,1.05]:
        local=np.maximum(0,t-at)
        foot += np.where(t>=at, noise(1.4,180,3800)*np.exp(-local/.027),0)*.42
    clips['march'] = foot
    t = timeline(3)
    clips['ocean'] = noise(3,100,4200)*(.4+.15*np.sin(2*np.pi*t/3))
    OUT.mkdir(parents=True,exist_ok=True)
    records = []
    for name, data in clips.items():
        edge = min(round(.008*RATE), len(data)//8)
        data[:edge] *= np.linspace(0,1,edge)
        data[-edge:] *= np.linspace(1,0,edge)
        data = np.tanh(data*.9)
        data *= .76 / max(.1,float(np.max(np.abs(data))))
        pcm = np.round(data*32767).astype('<i2')
        file = OUT/(name+'.wav')
        with wave.open(str(file),'wb') as writer:
            writer.setnchannels(1); writer.setsampwidth(2); writer.setframerate(RATE); writer.writeframes(pcm.tobytes())
        records.append({'file':file.name,'duration':len(data)/RATE,'peak':round(float(np.max(np.abs(data))),4),'rms':round(float(np.sqrt(np.mean(data*data))),4),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    (OUT/'manifest.json').write_text(json.dumps({'title':'Strait Front 1.8 original SFX','method':'Original deterministic DSP: seeded noise, band filters, transients, oscillator layers and envelopes. No third-party audio recordings.','rate':RATE,'format':'mono 16-bit PCM WAV','license':'MIT','clips':records},indent=2)+'\n',encoding='utf-8')
    print(f'Generated {len(records)} original WAV effects ({sum((OUT/r["file"]).stat().st_size for r in records):,} bytes).')


if __name__=='__main__':
    build()
