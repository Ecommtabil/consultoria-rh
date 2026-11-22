import type { ReactNode } from 'react';

export function SideRail({caption,children,className=''}:{caption:string;children:ReactNode;className?:string}){
  return <aside className={`side-rail${className?` ${className}`:''}`}>
    <div className="side-rail-inner">
      <p className="side-rail-caption">{caption}</p>
      <nav className="side-rail-nav" aria-label={caption}>{children}</nav>
    </div>
  </aside>;
}
