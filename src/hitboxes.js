'use strict';

// Shared world-space collision geometry. Rendering scale and camera never change hitboxes.
const Hitbox=Object.freeze({
  fighter(f){
    const width=f.robot?66:46;
    const height=f.robot?130:f.crouch?47:94;
    return {x:f.x-width/2,y:f.y-height,w:width,h:height};
  },
  summon(s){
    const width=s.shape==='robot'?72:46;
    const height=s.shape==='robot'?132:100;
    return {x:s.x-width/2,y:s.y-height,w:width,h:height};
  },
  rectRect(a,b){
    return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  },
  circleRect(x,y,r,b){
    const cx=Math.max(b.x,Math.min(x,b.x+b.w));
    const cy=Math.max(b.y,Math.min(y,b.y+b.h));
    return (x-cx)**2+(y-cy)**2<=r*r;
  },
  circleCircle(x,y,r,cx,cy,cr){
    return (x-cx)**2+(y-cy)**2<=(r+cr)**2;
  },
  // Sample a swept circle after broad-phase rejection. This catches fast projectiles
  // that would otherwise pass right through a fighter or puppet between frames.
  sweepCircleRect(x0,y0,x1,y1,r,b){
    const minX=Math.min(x0,x1)-r,maxX=Math.max(x0,x1)+r;
    const minY=Math.min(y0,y1)-r,maxY=Math.max(y0,y1)+r;
    if(maxX<b.x||minX>b.x+b.w||maxY<b.y||minY>b.y+b.h)return false;
    const length=Math.hypot(x1-x0,y1-y0);
    const n=Math.max(1,Math.ceil(length/Math.max(2,r*.6)));
    for(let i=0;i<=n;i++){
      const t=i/n;
      if(this.circleRect(x0+(x1-x0)*t,y0+(y1-y0)*t,r,b))return true;
    }
    return false;
  },
  // Distance to a swept segment, useful for moving circular targets in the RT arena.
  sweepCircleCircle(x0,y0,x1,y1,r,cx,cy,cr){
    const dx=x1-x0,dy=y1-y0,den=dx*dx+dy*dy;
    const t=den?Math.max(0,Math.min(1,((cx-x0)*dx+(cy-y0)*dy)/den)):0;
    return this.circleCircle(x0+t*dx,y0+t*dy,r,cx,cy,cr);
  }
});
