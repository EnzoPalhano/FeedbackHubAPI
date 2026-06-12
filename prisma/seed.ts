import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await hash('admin123', 12);
  const userHash = await hash('user123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@feedbackhub.com',
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@feedbackhub.com',
      passwordHash: userHash
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@feedbackhub.com',
      passwordHash: userHash
    }
  });

  const post1 = await prisma.post.create({
    data: {
      title: 'Bem-vindo ao Feedback Hub',
      content: 'Este é o post de boas-vindas da plataforma. Compartilhe suas ideias!',
      userId: admin.id
    }
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Dica de uso da API',
      content: 'Para autenticar, faça POST /login com email e senha e use o token retornado no header Authorization: Bearer <token>.',
      userId: user1.id
    }
  });

  const comment1 = await prisma.comment.create({
    data: {
      content: 'Ótima iniciativa! Obrigado.',
      userId: user1.id,
      postId: post1.id
    }
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Muito útil, valeu pela dica.',
      userId: user2.id,
      postId: post2.id
    }
  });

  await prisma.vote.create({
    data: { userId: user1.id, postId: post1.id, value: true }
  });
  await prisma.post.update({ where: { id: post1.id }, data: { score: { increment: 1 } } });
  await prisma.user.update({ where: { id: admin.id }, data: { karma: { increment: 1 } } });

  await prisma.vote.create({
    data: { userId: user2.id, postId: post1.id, value: true }
  });
  await prisma.post.update({ where: { id: post1.id }, data: { score: { increment: 1 } } });
  await prisma.user.update({ where: { id: admin.id }, data: { karma: { increment: 1 } } });

  await prisma.vote.create({
    data: { userId: admin.id, postId: post2.id, value: true }
  });
  await prisma.post.update({ where: { id: post2.id }, data: { score: { increment: 1 } } });
  await prisma.user.update({ where: { id: user1.id }, data: { karma: { increment: 1 } } });

  await prisma.vote.create({
    data: { userId: user2.id, commentId: comment1.id, value: true }
  });
  await prisma.comment.update({ where: { id: comment1.id }, data: { score: { increment: 1 } } });
  await prisma.user.update({ where: { id: user1.id }, data: { karma: { increment: 1 } } });

  await prisma.vote.create({
    data: { userId: user1.id, commentId: comment2.id, value: true }
  });
  await prisma.comment.update({ where: { id: comment2.id }, data: { score: { increment: 1 } } });
  await prisma.user.update({ where: { id: user2.id }, data: { karma: { increment: 1 } } });

  console.log('Seed concluído.');
  console.log(`  Usuários: admin@feedbackhub.com (senha: admin123), alice@feedbackhub.com (senha: user123), bob@feedbackhub.com (senha: user123)`);
  console.log(`  Posts: ${post1.id}, ${post2.id}`);
  console.log(`  Comentários: ${comment1.id}, ${comment2.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
