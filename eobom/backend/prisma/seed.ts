import prisma from '../src/config/prisma';
import facilitiesSeed from './seed-data/facilities.json';

async function main() {
  for (const f of facilitiesSeed) {
    await prisma.facility.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        type: f.type,
        location: f.location,
        lat: f.lat,
        lng: f.lng,
        price: f.price,
        rating: f.rating,
        religion: f.religion,
        guests: f.guests,
        tags: f.tags,
        amenities: f.amenities,
      },
      create: {
        id: f.id,
        name: f.name,
        type: f.type,
        location: f.location,
        lat: f.lat,
        lng: f.lng,
        price: f.price,
        rating: f.rating,
        religion: f.religion,
        guests: f.guests,
        tags: f.tags,
        amenities: f.amenities,
      },
    });
  }
  console.log(`시드 완료: Facility ${facilitiesSeed.length}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
