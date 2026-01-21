import { FastifyReply } from 'fastify';
import type { ApiResponse } from '@milanos/shared';

export function successResponse<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send({
    success: true,
    data,
  } as ApiResponse<T>);
}

export function errorResponse(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  return reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      details,
    },
  } as ApiResponse);
}

export function paginatedResponse<T>(
  reply: FastifyReply,
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  return reply.send({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
