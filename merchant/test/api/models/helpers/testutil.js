const uuidv4 = require('uuid/v4')

const fixtureGenerators = {
  adminUser: function() {
    const uid = uuidv4()
    return {
      lastname: `admin1_${uid}`,
      email: `admin_${uid}@example.com`,
      admin: 10,
      token: `adminToken_${uid}`,
      bounce: true,
    }
  },
  experiment: {
    context: function(obj) {
      return {
        instanceId: 1234,
        platform: {
          os: {
            family: 'iOS',
          },
          name: 'Safari',
        },
        ...obj,
      }
    },
    valid: function() {
      return {
        name: 'derp',
        startAt: new Date('2018-01-01'),
        endAt: new Date('2018-01-02'),
        rollout: {
          start: 0,
          end: 100,
        },
        buckets: [
          {
            name: 'control',
            start: 0,
            end: 50,
          },
          {
            name: 'treatment',
            start: 50,
            end: 100,
          },
        ],
        isActive: true,
      }
    },
  },
}

module.exports = {
  fixtureGenerators,
}