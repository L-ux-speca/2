'use strict';

// A single, predictable lifecycle for skills. Feature modules subscribe to
// hooks instead of replacing Fight.cast in an order-dependent chain.
const CombatHooks=(()=>{
  const before=[],overrides=[],after=[];
  const add=(list,fn)=>{
    if(typeof fn!=='function')throw TypeError('Combat hook must be a function');
    list.push(fn);
  };
  return Object.freeze({
    onBeforeCast(fn){add(before,fn)},
    onCastOverride(fn){add(overrides,fn)},
    onAfterCast(fn){add(after,fn)},
    allowCast(fight,actor,index){return before.every(fn=>fn(fight,actor,index)!==false)},
    override(fight,actor,index){
      for(const fn of overrides){
        const result=fn(fight,actor,index);
        if(result!==undefined)return !!result;
      }
      return undefined;
    },
    afterCast(fight,actor,index){for(const fn of after)fn(fight,actor,index)}
  });
})();
