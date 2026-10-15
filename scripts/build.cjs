const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});
const files=['index.html','legacy-simulator.html','styles.css','upgrade.css','campaign.css', 'campaign-core.js', 'campaign.js', 'frontline.css','content.js','engine.js','room.js','director.js','experience.js','tactics.js','world.js','frontline-view.js','frontline.js','app.js','assets','README.md','LICENSE','docs','counteroffensive'];
for(const name of files)fs.cpSync(path.join(root,name),path.join(dist,name),{recursive:true,filter:source=>!['dist','qa','node_modules','.git'].includes(path.basename(source))});
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built ${files.length} entries into dist/. No runtime dependencies.`);
