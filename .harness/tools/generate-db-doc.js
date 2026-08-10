#!/usr/bin/env node
// generate-db-doc.js — schema.prisma를 읽어 docs/00_핵심플랫폼/05_DB_요구사항_및_테이블_사전.md의
// "자동 생성" 구간만 갱신한다. 그 아래 "보충 설명" 구간은 사람이 손으로 관리하며 이 스크립트가
// 건드리지 않는다 — 두 구간을 나눈 이유와 사용법은 05번 문서 상단 안내 참고.
//
// 실행: node .harness/tools/generate-db-doc.js
// 의존성 없음(Node 내장 fs/path만 사용) — ts-node/npm install 없이 어디서나 실행 가능하게 하기 위함.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_PATH = path.join(ROOT, 'eobom', 'backend', 'prisma', 'schema.prisma');
const DOC_PATH = path.join(ROOT, 'docs', '00_핵심플랫폼', '05_DB_요구사항_및_테이블_사전.md');

const BEGIN_MARKER = '<!-- AUTO-GENERATED:BEGIN (generate-db-doc.js — 직접 수정 금지, schema.prisma를 고치고 스크립트를 재실행할 것) -->';
const END_MARKER = '<!-- AUTO-GENERATED:END -->';

const isSeparatorComment = (line) => /^\/\/\s*[─—\-_=]{5,}\s*$/.test(line.trim());

function parseSchema(schemaText) {
  const lines = schemaText.split(/\r?\n/);
  const models = [];
  let i = 0;

  while (i < lines.length) {
    const modelMatch = lines[i].match(/^model\s+(\w+)\s*\{/);
    if (!modelMatch) {
      i++;
      continue;
    }

    // model 선언 바로 위에 붙어있는 연속 `//` 주석 = 이 모델의 한 줄 설명. 장식용 구분선(───)은 제외.
    const descLines = [];
    let j = i - 1;
    while (j >= 0 && /^\/\//.test(lines[j].trim())) {
      if (!isSeparatorComment(lines[j])) descLines.unshift(lines[j].trim().replace(/^\/\/\s*/, ''));
      j--;
    }

    const model = {
      name: modelMatch[1],
      description: descLines.join(' '),
      fields: [],
      constraints: [],
    };

    const isFieldLine = (s) => /^[A-Za-z_]\w*\s+[A-Za-z_][\w.\[\]?]*/.test(s) && !s.startsWith('//');
    let pendingLeading = []; // 필드 위에 붙은 단독 주석 줄 — 바로 아래가 필드면 그 필드의 "머리말"로 붙인다

    i++;
    while (i < lines.length && !/^\}/.test(lines[i])) {
      const raw = lines[i];
      const trimmed = raw.trim();

      const constraintMatch = trimmed.match(/^@@(\w+)\(([^)]*)\)\s*(?:\/\/\s*(.*))?$/);
      if (constraintMatch) {
        model.constraints.push({
          kind: constraintMatch[1],
          args: constraintMatch[2],
          comment: constraintMatch[3] || '',
        });
        i++;
        continue;
      }

      // 단독 `//` 주석 줄: 바로 다음 줄이 필드면 그 필드의 머리말 주석(예: isPartner 위 블록 주석),
      // 아니면(공백/제약조건/블록끝) 직전 필드 설명이 길어서 줄바꿈된 연속으로 본다(예: unlinkedAt).
      if (trimmed.startsWith('//') && !isSeparatorComment(trimmed)) {
        const text = trimmed.replace(/^\/\/\s*/, '');
        const nextTrimmed = (lines[i + 1] || '').trim();
        if (isFieldLine(nextTrimmed)) {
          pendingLeading.push(text);
        } else if (model.fields.length) {
          const prev = model.fields[model.fields.length - 1];
          prev.comment = prev.comment ? `${prev.comment} ${text}` : text;
        }
        i++;
        continue;
      }

      // 필드 라인: `이름  타입(모디파이어 포함)  [@속성...]  [// 설명]`
      const fieldMatch = trimmed.match(/^([A-Za-z_]\w*)\s+([A-Za-z_][\w.\[\]?]*)\s*(.*)$/);
      if (fieldMatch && !trimmed.startsWith('//')) {
        const [, fname, ftype, restOfLine] = fieldMatch;
        const commentIdx = restOfLine.indexOf('//');
        const inlineComment = commentIdx >= 0 ? restOfLine.slice(commentIdx + 2).trim() : '';
        const leading = pendingLeading.join(' ');
        pendingLeading = [];
        const comment = [leading, inlineComment].filter(Boolean).join(leading && inlineComment ? ' — ' : '');
        model.fields.push({ name: fname, type: ftype, comment });
      }
      i++;
    }

    models.push(model);
    i++;
  }

  return models;
}

function renderMarkdown(models) {
  const modelNames = new Set(models.map((m) => m.name));
  // 상대 모델 타입을 그대로 가리키는 필드(`user User @relation(...)`, `leads Lead[]` 등)는
  // 실제 물리 컬럼이 아니라 Prisma가 만들어주는 관계 포인터다 — FK 스칼라 컬럼(예: userId)이
  // 진짜 컬럼이고, 이건 그 관계를 사람이 읽기 편하게 보여주는 뷰일 뿐이라 별도 목록으로 뺀다.
  const baseType = (t) => t.replace(/[\[\]?]/g, '');
  // 원본 주석에 `|`가 들어있으면(예: "'장례식장' | '묘지/수목장'") 마크다운 테이블 셀 구분자와
  // 충돌해 열이 깨진다 — 이스케이프해서 셀 안에 그대로 보이게 한다.
  const escapeCell = (s) => s.replace(/\|/g, '\\|');

  const parts = [];
  for (const model of models) {
    const columns = model.fields.filter((f) => !modelNames.has(baseType(f.type)));
    const relations = model.fields.filter((f) => modelNames.has(baseType(f.type)));

    parts.push(`### \`${model.name}\``);
    if (model.description) parts.push(`> ${model.description}`);
    parts.push('');
    parts.push('| 컬럼 | 타입 | 설명 |');
    parts.push('|---|---|---|');
    for (const f of columns) {
      const desc = f.comment ? escapeCell(f.comment) : '_(설명 없음 — schema.prisma에 주석 보강 필요)_';
      parts.push(`| \`${f.name}\` | \`${f.type}\` | ${desc} |`);
    }
    if (relations.length) {
      parts.push('');
      parts.push('**관계 필드** (물리 컬럼 아님 — Prisma가 FK를 통해 연결해 보여주는 뷰)');
      parts.push('');
      parts.push('| 필드 | 대상 모델 | 설명 |');
      parts.push('|---|---|---|');
      for (const f of relations) {
        const desc = f.comment ? escapeCell(f.comment) : '';
        parts.push(`| \`${f.name}\` | \`${f.type}\` | ${desc} |`);
      }
    }
    if (model.constraints.length) {
      parts.push('');
      parts.push('**제약조건**');
      for (const c of model.constraints) {
        const suffix = c.comment ? ` — ${c.comment}` : '';
        parts.push(`- \`@@${c.kind}(${c.args})\`${suffix}`);
      }
    }
    parts.push('');
  }
  return parts.join('\n').trimEnd();
}

function main() {
  const schemaText = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const models = parseSchema(schemaText);
  const generated = renderMarkdown(models);

  const existing = fs.existsSync(DOC_PATH) ? fs.readFileSync(DOC_PATH, 'utf-8') : '';
  const beginIdx = existing.indexOf(BEGIN_MARKER);
  const endIdx = existing.indexOf(END_MARKER);

  const generatedBlock = `${BEGIN_MARKER}\n\n${generated}\n\n${END_MARKER}`;

  let output;
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    output = existing.slice(0, beginIdx) + generatedBlock + existing.slice(endIdx + END_MARKER.length);
  } else {
    // 마커가 없는 초기 상태 — 표준 골격(헤더 + 자동생성 + 보충설명)으로 새로 만든다.
    output = [
      '# 🗄️ 05. DB 요구사항 및 테이블 사전 (Prisma Schema)',
      '',
      '> **문서 목적**: 이어봄 (Eobom) PostgreSQL 데이터베이스(`eobom_db`)의 핵심 테이블 스키마 컬럼 및 관계(Relationship) 사전을 정의합니다.',
      '>',
      '> **관리 방식(2026-08-10 개편)**: 이 문서는 두 구간으로 나뉜다.',
      '> 1. **자동 생성 구간**(아래 `AUTO-GENERATED` 마커 사이) — `eobom/backend/prisma/schema.prisma`의 한글 주석에서',
      '>    `node .harness/tools/generate-db-doc.js`로 추출한다. 스키마가 바뀌면 이 구간을 직접 고치지 말고,',
      '>    **schema.prisma의 주석을 고친 뒤 스크립트를 재실행**할 것 — 두 곳이 갈라지는 걸(drift) 막기 위함.',
      '> 2. **보충 설명 구간**(그 아래) — JSON 필드의 실제 형태, 상태값 전이, 테이블 간 업무 흐름처럼 한 줄 주석으로',
      '>    담기 어려운 서술은 여기 사람이 직접 쓴다. 스크립트는 이 구간을 절대 건드리지 않는다.',
      '',
      '---',
      '',
      '## 📋 자동 생성: 테이블·컬럼 사전',
      '',
      generatedBlock,
      '',
      '---',
      '',
      '## 📝 보충 설명 (수동 관리 — 자동 생성 스크립트가 건드리지 않음)',
      '',
      '_아래에 JSON 필드 실제 형태, 상태값 전이도, 테이블 간 업무 흐름 등을 채워나갈 것._',
      '',
    ].join('\n');
  }

  fs.writeFileSync(DOC_PATH, output, 'utf-8');
  const modelNames = new Set(models.map((m) => m.name));
  const baseType = (t) => t.replace(/[\[\]?]/g, '');
  const physicalColumns = models.flatMap((m) => m.fields.filter((f) => !modelNames.has(baseType(f.type))));
  const undocumented = physicalColumns.filter((f) => !f.comment).length;
  console.log(
    `생성 완료: 모델 ${models.length}개, 물리 컬럼 ${physicalColumns.length}개(설명 없음 ${undocumented}개) -> ${path.relative(ROOT, DOC_PATH)}`
  );
}

main();
