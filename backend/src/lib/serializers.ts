import type { Prisma } from '@prisma/client';

export type EventWithCount = Prisma.EventGetPayload<{
  include: { _count: { select: { registrations: true } } };
}>;

export type EventWithCreatorAndCount = Prisma.EventGetPayload<{
  include: {
    creator: { select: { id: true; name: true } };
    _count: { select: { registrations: true } };
  };
}>;

export type RegistrationWithRelations = Prisma.RegistrationGetPayload<{
  include: {
    event: { include: { _count: { select: { registrations: true } } } };
    user: { select: { id: true; name: true; email: true } };
  };
}>;

export function toEventDto(event: EventWithCount | EventWithCreatorAndCount) {
  const { _count, creator, ...rest } = event as EventWithCreatorAndCount;
  const registeredCount = _count.registrations;

  return {
    ...rest,
    ...(creator ? { creator } : {}),
    registeredCount,
    remainingSeats: Math.max(0, rest.capacity - registeredCount),
  };
}

export function toRegistrationDto(registration: RegistrationWithRelations) {
  const { event, user, ...rest } = registration;
  return {
    ...rest,
    event: toEventDto(event),
    ...(user ? { user } : {}),
  };
}
