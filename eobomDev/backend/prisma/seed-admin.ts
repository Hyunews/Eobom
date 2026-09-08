// 운영자(Admin) 계정 생성 전용 스크립트. 공개 가입 API가 없다 — 이 스크립트로만 만든다.
// 사용법: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npx ts-node prisma/seed-admin.ts
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || '운영자';

  if (!email || !password) {
    console.error('ADMIN_EMAIL, ADMIN_PASSWORD 환경변수가 필요합니다.');
    console.error('예: ADMIN_EMAIL=admin@eobom.co.kr ADMIN_PASSWORD=비밀번호 ADMIN_NAME=이름 npx ts-node prisma/seed-admin.ts');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('비밀번호는 8자 이상이어야 합니다.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`운영자 계정 생성/갱신 완료: ${admin.email} (${admin.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
