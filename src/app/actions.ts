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

// 저장된 모든 데이터 불러오기 함수 (초기 로딩용 - 사진은 최근 7일치만)
export async function getDashboardData() {
  const dailyRecordsRaw = await prisma.dailyRecord.findMany({
    select: {
      id: true,
      userId: true,
      date: true,
      weight: true,
      exercised: true,
      exerciseType: true,
      user: true,
    },
    orderBy: { date: 'asc' }
  })

  // 최근 14일치 사진만 초기 로딩에 포함 (대시보드 표시용)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentPhotos = await prisma.dailyRecord.findMany({
    where: { date: { gte: fourteenDaysAgo } },
    select: { userId: true, date: true, breakfastUrl: true, lunchUrl: true, dinnerUrl: true }
  });

  const dailyRecords = dailyRecordsRaw.map(r => {
    const photo = recentPhotos.find(p => p.userId === r.userId && p.date.getTime() === r.date.getTime());
    return { ...r, breakfastUrl: photo?.breakfastUrl, lunchUrl: photo?.lunchUrl, dinnerUrl: photo?.dinnerUrl };
  });
  
  const inbodyRecords = await prisma.inbodyRecord.findMany({
    include: { user: true },
    orderBy: { date: 'asc' }
  })
  
  return { dailyRecords, inbodyRecords }
}

// 갤러리 탭 진입 시 과거 모든 사진 데이터 불러오기 함수
export async function getAllGalleryData() {
  const photos = await prisma.dailyRecord.findMany({
    select: { userId: true, date: true, breakfastUrl: true, lunchUrl: true, dinnerUrl: true },
    where: {
      OR: [
        { breakfastUrl: { not: null } },
        { lunchUrl: { not: null } },
        { dinnerUrl: { not: null } },
      ]
    }
  });
  return photos;
}
