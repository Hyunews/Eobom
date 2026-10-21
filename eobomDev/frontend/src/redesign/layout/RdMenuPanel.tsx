import React from 'react';
import type { MenuPart } from './RdHeader';
import { PART1_ITEMS, PART1_TITLE, PART2_ITEMS, PART2_TITLE, type NavItem } from '../nav';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function RdItem({ item, no, onNavigate }: { item: NavItem; no: number; onNavigate: () => void }) {
  return (
    <a href={item.to} className="rd-item" onClick={onNavigate}>
      <span className="rd-item__no">{pad2(no)}</span>
      {item.label}
    </a>
  );
}

/** 데스크톱 메뉴 펼침 — 두 부를 한 판에 "차례" 모양으로. 열어 둔 쪽의 표제가 먹색, 다른 쪽은 작은 글자색. */
export function RdMenuPanel({ active, onNavigate }: { active: MenuPart; onNavigate: () => void }) {
  return (
    <div className="rd-panel" id="rd-menu-panel">
      <div className="rd-container rd-panel__inner">
        <section className="rd-panel__sec" data-on={active === 'part1'} aria-labelledby="rd-part1">
          <p className="rd-panel__title" id="rd-part1" data-on={active === 'part1'}>{PART1_TITLE}</p>
          <div className="rd-panel__list">
            {PART1_ITEMS.map((it, i) => (
              <RdItem key={it.label} item={it} no={i + 1} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
        <section className="rd-panel__sec" data-on={active === 'part2'} aria-labelledby="rd-part2">
          <p className="rd-panel__title" id="rd-part2" data-on={active === 'part2'}>{PART2_TITLE}</p>
          <div className="rd-panel__list rd-panel__list--2col">
            {PART2_ITEMS.map((it, i) => (
              <RdItem key={it.label} item={it} no={i + 1} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
