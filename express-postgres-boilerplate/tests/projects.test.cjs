const assert = require('node:assert/strict')
const { test } = require('node:test')
const { PrismaClient } = require('@prisma/client')

const password = 'changeMeOwner1!'
const base = 'http://127.0.0.1:8080/api'

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5_000),
  })
  const payload = response.status === 204 ? undefined : await response.json()
  return { status: response.status, data: payload?.data }
}

async function login(email) {
  const response = await request('/auth/login', { method: 'POST', body: { email, password } })
  assert.equal(response.status, 200)
  assert.ok(response.data.accessToken)
  return response.data.accessToken
}

async function organizers(token) {
  const response = await request('/projects/organizers', { token })
  assert.equal(response.status, 200)
  return response.data
}

test('projects support authorized CRUD and deny cross-tenant and revoked access', async () => {
  assert.equal(process.env.NODE_ENV, 'test', 'Use an isolated CI database')
  const database = new URL(process.env.DATABASE_URL)
  assert.equal(database.hostname, '127.0.0.1')
  assert.equal(database.port, '5433')
  assert.equal(database.pathname, '/app_db')

  const owner = await login('owner@example.com')
  const otherOwner = await login('owner2@example.com')
  const staff = await login('staff1@example.com')

  const mine = await organizers(owner)
  const other = await organizers(otherOwner)
  assert.equal(mine.length, 1)
  assert.equal(other.length, 1)
  assert.notEqual(mine[0].id, other[0].id)
  assert.deepEqual(await organizers(staff), mine)

  const path = `/projects/${mine[0].id}`
  const otherPath = `/projects/${other[0].id}`
  assert.equal((await request(path)).status, 401)
  assert.equal((await request(otherPath, { token: owner })).status, 404)
  assert.equal((await request(otherPath, {
    method: 'POST', token: owner, body: { name: 'Outside my organizer' },
  })).status, 404)
  assert.equal((await request(path, {
    method: 'POST', token: owner, body: { name: '   ' },
  })).status, 400)

  const created = await request(path, {
    method: 'POST', token: owner, body: { name: 'New project' },
  })
  assert.equal(created.status, 201)
  const projectPath = `${path}/${created.data.id}`
  try {
    assert.equal((await request(projectPath, {
      method: 'PATCH', token: otherOwner, body: { name: 'Forbidden update' },
    })).status, 404)
    assert.equal((await request(`${otherPath}/${created.data.id}`, {
      method: 'DELETE', token: otherOwner,
    })).status, 404)
    assert.equal((await request(projectPath, { method: 'DELETE', token: otherOwner })).status, 404)

    assert.equal((await request(projectPath, {
      method: 'PATCH', token: staff, body: { name: 'Renamed project' },
    })).status, 204)
    const list = await request(path, { token: owner })
    assert.equal(list.status, 200)
    assert.equal(list.data.find(({ id }) => id === created.data.id).name, 'Renamed project')

    const prisma = new PrismaClient()
    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: 'staff1@example.com' } })
      const assignment = { userId: user.id, organizerId: mine[0].id }
      await prisma.organizerStaff.delete({ where: { organizerId_userId: assignment } })
      try {
        assert.deepEqual(await organizers(staff), [])
        assert.equal((await request(path, { token: staff })).status, 404)
        assert.equal((await request(projectPath, { method: 'DELETE', token: staff })).status, 404)
      } finally {
        await prisma.organizerStaff.create({ data: assignment })
      }
    } finally {
      await prisma.$disconnect()
    }
  } finally {
    assert.equal((await request(projectPath, { method: 'DELETE', token: owner })).status, 204)
  }
  const afterDelete = await request(path, { token: owner })
  assert.equal(afterDelete.status, 200)
  assert.ok(afterDelete.data.every(({ id }) => id !== created.data.id))
})
