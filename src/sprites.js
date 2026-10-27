'use strict';

// Optional image animation layer. Actual textures are never edited or recompressed.
// When an animation is missing, the original Canvas fighter is drawn instead.
const SpriteSystem=(()=>{
  const characters=new Map(),images=new Map();
  const states=new Set(['idle','walk','run','jump','crouch','block','hit',
    'punch','kick','throw','skill','ko']);
  const load=path=>{
    if(!images.has(path)){
      if(typeof Image==='undefined')return null;
      const image=new Image();
      image.src=path;
      images.set(path,image);
    }
    const image=images.get(path);
    return image?.complete&&image.naturalWidth>0&&image.naturalHeight>0?image:null;
  };
  const stateFor=f=>{
    if(f.hp<=0)return 'ko';
    if(f.stun>.08)return 'hit';
    if(f.block)return 'block';
    if(f.attack?.kind==='punch')return 'punch';
    if(f.attack?.kind==='kick')return 'kick';
    if(f.attack?.kind==='throw')return 'throw';
    if(f.pose>0)return 'skill';
    if(f.crouch)return 'crouch';
    if(!f.grounded)return 'jump';
    if(f.dashTime>0)return 'run';
    if(f.moving)return 'walk';
    return 'idle';
  };
  const register=(id,config)=>{
    if(!id||!config||typeof config!=='object'||!config.states)
      throw Error('Sprite manifest requires states');
    const prepared={displayHeight:config.displayHeight||100,states:{}};
    for(const [state,a] of Object.entries(config.states)){
      if(!states.has(state)||(!a.src&&!Array.isArray(a.paths)))
        throw Error(`Invalid sprite animation: ${id}/${state}`);
      if(a.paths&&(!a.paths.length||!a.paths.every(p=>typeof p==='string'&&p)))
        throw Error(`Invalid frame paths: ${id}/${state}`);
      if(a.src&&(!a.frameWidth||!a.frameHeight))
        throw Error(`Spritesheet needs frameWidth/frameHeight: ${id}/${state}`);
      prepared.states[state]={...a,fps:clamp(a.fps||8,1,60),
        frames:a.paths?.length||Math.max(1,Math.floor(a.frames||1))};
    }
    characters.set(id,prepared);
  };
  const frameIndex=(animation,elapsed)=>{
    const count=animation.frames||animation.paths?.length||1;
    const index=Math.floor(Math.max(0,elapsed)*(animation.fps||8));
    return animation.loop===false?Math.min(count-1,index):index%count;
  };
  const draw=(ctx,f,time,scale=1)=>{
    const config=characters.get(f.c?.id);
    if(!config)return false;
    const state=stateFor(f),animation=config.states[state];
    if(!animation)return false;
    if(f._spriteState!==state){f._spriteState=state;f._spriteStart=time;}
    const frame=frameIndex(animation,time-(f._spriteStart??time));
    const img=load(animation.paths?animation.paths[frame]:animation.src);
    if(!img)return false;
    const fw=animation.paths?img.naturalWidth:animation.frameWidth;
    const fh=animation.paths?img.naturalHeight:animation.frameHeight;
    const sx=animation.paths?0:(frame*fw)%img.naturalWidth;
    const sy=animation.paths?0:Math.floor(frame*fw/img.naturalWidth)*fh;
    if(sx+fw>img.naturalWidth||sy+fh>img.naturalHeight)return false;
    const height=(animation.displayHeight||config.displayHeight)*
      (animation.scale||1),width=height*(fw/fh);
    ctx.save();
    ctx.translate(f.x+(animation.offsetX||0),f.y+(animation.offsetY||0));
    ctx.scale((f.face||1)*scale,scale);
    if(f.st?.inv>0&&Math.floor(time*18)%2===0)ctx.globalAlpha*=.35;
    ctx.drawImage(img,sx,sy,fw,fh,-width/2,-height,width,height);
    ctx.restore();
    if(f.st?.slow>0)canvasText(ctx,'↓',f.x,f.y-118,16,'#a4d8fa');
    if(f.st?.poison>0)circle(ctx,f.x-19,f.y-74,3,'#b7db6f');
    if(f.st?.bleed>0)circle(ctx,f.x+19,f.y-74,3,'#fc6b87');
    return true;
  };
  for(const [id,config] of Object.entries(SPRITE_MANIFEST))register(id,config);
  return Object.freeze({register,get:id=>characters.get(id)||null,stateFor,frameIndex,draw});
})();
