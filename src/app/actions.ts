'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 일일 기록 (식단, 운동, 체중) 저장/수정 함수
export async function saveDailyRecord(data: {
  userId: string;
  name: string;
  themeColor: string;
  date: string;
  weight?: number;
  exercised: boolean;
  exerciseType?: string;
  breakfastUrl?: string;
  lunchUrl?: string;
  dinnerUrl?: string;
}) {
  // 사용자 정보가 없으면 생성 (이름 기준)
  let user = await prisma.user.findFirst({ where: { id: data.userId } })
  if (!user) {
    user = await prisma.user.create({
      data: { id: data.userId, name: data.name, themeColor: data.themeColor }
    })
  }

  const parsedDate = new Date(data.date)

  // 같은 날짜의 기록이 있으면 덮어쓰기(update), 없으면 새로 생성(create)
  await prisma.dailyRecord.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: parsedDate
      }
    },
    update: {
      weight: data.weight,
      exercised: data.exercised,
      exerciseType: data.exerciseType,
      breakfastUrl: data.breakfastUrl,
      lunchUrl: data.lunchUrl,
      dinnerUrl: data.dinnerUrl,
    },
    create: {
      userId: user.id,
      date: parsedDate,
      weight: data.weight,
      exercised: data.exercised,
      exerciseType: data.exerciseType,
      breakfastUrl: data.breakfastUrl,
      lunchUrl: data.lunchUrl,
      dinnerUrl: data.dinnerUrl,
    }
  })

  // 화면 새로고침 효과 (캐시 무효화)
  revalidatePath('/')
}

// 인바디 기록 저장/수정 함수
export async function saveInbodyRecord(data: {
  userId: string;
  name: string;
  themeColor: string;
  date: string;
  muscleMass?: number;
  fatMass?: number;
  fatPercentage?: number;
}) {
  let user = await prisma.user.findFirst({ where: { id: data.userId } })
  if (!user) {
    user = await prisma.user.create({
      data: { id: data.userId, name: data.name, themeColor: data.themeColor }
    })
  }

  const parsedDate = new Date(data.date)

  await prisma.inbodyRecord.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: parsedDate
      }
    },
    update: {
      muscleMass: data.muscleMass,
      fatMass: data.fatMass,
      fatPercentage: data.fatPercentage,
    },
    create: {
      userId: user.id,
      date: parsedDate,
      muscleMass: data.muscleMass,
      fatMass: data.fatMass,
      fatPercentage: data.fatPercentage,
    }
  })

  revalidatePath('/')
}

// 일일 기록 삭제 함수
export async function deleteDailyRecord(userId: string, date: string) {
  try {
    await prisma.dailyRecord.delete({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      }
    });
  } catch (e) {
    console.error("Delete daily record failed:", e);
  }
  revalidatePath('/');
}

// 인바디 기록 삭제 함수
export async function deleteInbodyRecord(userId: string, date: string) {
  try {
    await prisma.inbodyRecord.delete({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      }
    });
  } catch (e) {
    console.error("Delete inbody record failed:", e);
  }
  revalidatePath('/');
}

// 저장된 모든 데이터 불러오기 함수
export async function getDashboardData() {
  const dailyRecords = await prisma.dailyRecord.findMany({
    include: { user: true },
    orderBy: { date: 'asc' }
  })
  
  const inbodyRecords = await prisma.inbodyRecord.findMany({
    include: { user: true },
    orderBy: { date: 'asc' }
  })
  
  return { dailyRecords, inbodyRecords }
}
