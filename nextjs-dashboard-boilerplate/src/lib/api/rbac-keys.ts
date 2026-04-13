const baseKey = ['rbac'] as const

export const rbacKeys = {
  all: baseKey,
  definitions: () => [...baseKey, 'definitions'] as const,
}
