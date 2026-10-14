(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.FrontAudio=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CLIPS=['select','order','rifle','gun','missile','impact','explosion','water','intercept','sink','warning','capture','victory','defeat','engine','march','ocean'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  return class AudioSystem{
    constructor(options={}){
      this.options=options;this.ctx=options.context||null;this.buffers=options.buffers||{};this.ready=!!options.buffers;
      this.enabled=true;this.volume=55;this.suspended=true;this.phase=this.ready?'ready':'locked';this.active=new Map();this.loops=new Map();this.lastPlayed=new Map();this.timers=new Set();this.serial=0;this.playCount=0;this.lastClip='';this.onChange=options.onChange||(()=>{});
      if(this.ctx)this.graph();
    }
    graph(){
      if(this.master)return;const c=this.ctx;this.master=c.createGain();this.master.gain.value=this.volume/100;
      this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-16;this.compressor.knee.value=14;this.compressor.ratio.value=6;this.compressor.attack.value=.003;this.compressor.release.value=.18;
      this.analyser=c.createAnalyser();this.analyser.fftSize=256;this.samples=new Float32Array(256);
      this.compressor.connect(this.master);this.master.connect(this.analyser);this.analyser.connect(c.destination);
    }
    unlock(){
      if(this.loading)return this.loading;
      this.loading=(async()=>{
        if(!this.ctx){const factory=this.options.contextFactory||(()=>new(window.AudioContext||window.webkitAudioContext)());this.ctx=factory();this.graph();}
        await this.ctx.resume();if(this.ready){this.phase='ready';this.onChange();return true;}
        this.phase='loading';this.onChange();const fetcher=this.options.fetch||fetch;
        await Promise.all(CLIPS.map(async name=>{const response=await fetcher('./assets/audio/'+name+'.wav');if(!response.ok)throw Error('Audio asset '+response.status);this.buffers[name]=await this.ctx.decodeAudioData(await response.arrayBuffer());}));
        this.ready=true;this.phase='ready';this.onChange();return true;
      })().catch(()=>{this.phase='unavailable';this.onChange();return false;}).finally(()=>{this.loading=null;});
      return this.loading;
    }
    setEnabled(value){this.enabled=!!value;if(!this.enabled)this.stopAll();this.onChange();}
    setVolume(value){const n=Number(value);this.volume=Number.isFinite(n)?clamp(n,0,100):55;if(this.master)this.master.gain.value=this.volume/100;if(!this.volume)this.stopAll();this.onChange();}
    setSuspended(value){value=!!value;if(value===this.suspended)return;this.suspended=value;if(value)for(const voice of [...this.active.values()])if(voice.channel!=='ui')this.stop(voice);this.onChange();}
    forget(voice){this.active.delete(voice.id);if(voice.loopKey&&this.loops.get(voice.loopKey)===voice)this.loops.delete(voice.loopKey);try{voice.source.disconnect();voice.gain.disconnect();voice.pan?.disconnect();}catch{}}
    stop(voice){if(!this.active.has(voice.id))return;try{voice.gain.gain.cancelScheduledValues(this.ctx.currentTime);voice.gain.gain.setValueAtTime(voice.gain.gain.value,this.ctx.currentTime);voice.gain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.025);voice.source.stop(this.ctx.currentTime+.03);}catch{}this.active.delete(voice.id);if(voice.loopKey)this.loops.delete(voice.loopKey);}
    stopAll(){for(const timer of this.timers)clearTimeout(timer);this.timers.clear();for(const voice of [...this.active.values()])this.stop(voice);}
    play(name,options={}){
      const channel=options.channel||'battle';
      if(!this.ready||!this.ctx||this.ctx.state!=='running'||!this.enabled||!this.volume||(this.suspended&&channel!=='ui')||!this.buffers[name])return false;
      const now=this.ctx.currentTime,last=this.lastPlayed.get(name)??-Infinity,interval={gun:.085,rifle:.1,impact:.09,water:.14,explosion:.2,warning:.8}[name]||.035;
      if(!options.loop&&now-last<interval)return false;
      if(this.active.size>=10){const oldest=[...this.active.values()].find(v=>!v.loopKey&&v.channel==='battle')||[...this.active.values()].find(v=>!v.loopKey);if(!oldest)return false;this.stop(oldest);}
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner?.();source.buffer=this.buffers[name];source.loop=!!options.loop;source.playbackRate.value=options.rate||1;
      gain.gain.value=clamp(options.gain??(channel==='ui'?.4:1),0,1);source.connect(gain);if(pan){pan.pan.value=clamp(options.pan||0,-.85,.85);gain.connect(pan);pan.connect(this.compressor);}else gain.connect(this.compressor);
      const voice={id:++this.serial,source,gain,pan,channel,name,loopKey:options.loopKey};this.active.set(voice.id,voice);source.onended=()=>this.forget(voice);source.start();this.lastPlayed.set(name,now);this.playCount++;this.lastClip=name;this.onChange();return voice;
    }
    loop(key,name,options={}){
      const previous=this.loops.get(key);
      if(previous?.name===name){if(previous.pan)previous.pan.pan.value=clamp(options.pan||0,-.85,.85);return;}
      if(previous)this.stop(previous);if(!name)return;
      const voice=this.play(name,{...options,channel:key==='ambient'?'ambient':'movement',gain:options.gain??.18,loop:true,loopKey:key});if(voice)this.loops.set(key,voice);
    }
    level(){if(!this.analyser||!this.active.size||!this.enabled)return 0;this.analyser.getFloatTimeDomainData(this.samples);let sum=0;for(const x of this.samples)sum+=x*x;return Math.sqrt(sum/this.samples.length);}
    async preview(){
      if(!await this.unlock()||!this.enabled||!this.volume)return;
      this.play('gun',{channel:'ui',gain:.6,pan:-.3});
      for(const [delay,name,gain,pan] of [[220,'water',.45,.25],[550,'explosion',.4,0]]){const timer=setTimeout(()=>{this.timers.delete(timer);this.play(name,{channel:'ui',gain,pan});},delay);this.timers.add(timer);}
    }
  };
});
