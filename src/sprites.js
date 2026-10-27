'use strict';

// Optional image animation layer. Actual textures are never edited or recompressed.
// When an animation is missing, the original Canvas fighter is drawn instead.
const SpriteSystem=(()=>{
  const characters=new Map(),images=new Map(),frameBounds=new WeakMap();
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
  // Measure only opaque pixels, once per loaded frame. All supplied PNGs have
  // wide transparent borders; drawing the full 384x576 canvas was wasting
  // most of the fighter's limited on-screen resolution.
  const visibleFrame=(img,sx,sy,fw,fh)=>{
    let cache=frameBounds.get(img);
    if(!cache){cache=new Map();frameBounds.set(img,cache)}
    const key=[sx,sy,fw,fh].join(':');
    if(cache.has(key))return cache.get(key);
    let rect={x:0,y:0,w:fw,h:fh};
    if(typeof document!=='undefined'&&typeof document.createElement==='function'){
      try{
        const canvas=document.createElement('canvas');
        canvas.width=fw;canvas.height=fh;
        const pen=canvas.getContext('2d',{willReadFrequently:true});
        if(pen){
          pen.drawImage(img,sx,sy,fw,fh,0,0,fw,fh);
          const pixels=pen.getImageData(0,0,fw,fh).data;
          let left=fw,top=fh,right=-1,bottom=-1;
          for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){
            if(pixels[(y*fw+x)*4+3]<12)continue;
            if(x<left)left=x;if(x>right)right=x;
            if(y<top)top=y;if(y>bottom)bottom=y;
          }
          if(right>=left&&bottom>=top){
            left=Math.max(0,left-2);top=Math.max(0,top-2);
            right=Math.min(fw-1,right+2);bottom=Math.min(fh-1,bottom+2);
            rect={x:left,y:top,w:right-left+1,h:bottom-top+1};
          }
        }
      }catch(_error){/* Browser denied pixel read: use the full image. */}
    }
    cache.set(key,rect);
    return rect;
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
    const state=stateFor(f),animation=config.states[state]||config.states.idle;
    if(!animation)return false;
    const actualState=config.states[state]?state:'idle';
    if(f._spriteState!==actualState){f._spriteState=actualState;f._spriteStart=time;}
    const frame=frameIndex(animation,time-(f._spriteStart??time));
    const img=load(animation.paths?animation.paths[frame]:animation.src);
    if(!img)return false;
    const fw=animation.paths?img.naturalWidth:animation.frameWidth;
    const fh=animation.paths?img.naturalHeight:animation.frameHeight;
    const sx=animation.paths?0:(frame*fw)%img.naturalWidth;
    const sy=animation.paths?0:Math.floor(frame*fw/img.naturalWidth)*fh;
    if(sx+fw>img.naturalWidth||sy+fh>img.naturalHeight)return false;
    const trim=visibleFrame(img,sx,sy,fw,fh);
    // Use the standing image as a common reference. Crouching therefore keeps
    // its naturally shorter silhouette instead of expanding to full height.
    const idle=config.states.idle||animation;
    const idleImg=load(idle.paths?idle.paths[0]:idle.src);
    const idleW=idle.paths?idleImg?.naturalWidth:idle.frameWidth;
    const idleH=idle.paths?idleImg?.naturalHeight:idle.frameHeight;
    const idleTrim=idleImg&&idleW&&idleH?
      visibleFrame(idleImg,0,0,idleW,idleH):null;
    const referenceHeight=idleTrim?.h||fh*.93;
    const unit=(animation.displayHeight||config.displayHeight)*
      (animation.scale||1)/referenceHeight;
    const width=trim.w*unit,height=trim.h*unit;
    // Preserve the source image's horizontal centre through all poses.
    const centreOffset=(trim.x+trim.w/2-fw/2)*unit;
    ctx.save();
    ctx.translate(f.x+(animation.offsetX||0),f.y+(animation.offsetY||0));
    ctx.scale((f.face||1)*scale,scale);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    if(f.st?.inv>0&&Math.floor(time*18)%2===0)ctx.globalAlpha*=.35;
    ctx.drawImage(img,sx+trim.x,sy+trim.y,trim.w,trim.h,
      centreOffset-width/2,-height,width,height);
    ctx.restore();
    if(f.st?.slow>0)canvasText(ctx,'↓',f.x,f.y-118,16,'#a4d8fa');
    if(f.st?.poison>0)circle(ctx,f.x-19,f.y-74,3,'#b7db6f');
    if(f.st?.bleed>0)circle(ctx,f.x+19,f.y-74,3,'#fc6b87');
    return true;
  };
  for(const [id,config] of Object.entries(SPRITE_MANIFEST))register(id,config);
  return Object.freeze({register,get:id=>characters.get(id)||null,stateFor,frameIndex,draw});
})();
