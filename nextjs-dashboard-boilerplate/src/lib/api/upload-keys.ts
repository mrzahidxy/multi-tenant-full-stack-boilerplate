const baseKey = ['uploads'] as const

export const uploadKeys = {
  all: baseKey,
  image: () => [...baseKey, 'image'] as const,
}
