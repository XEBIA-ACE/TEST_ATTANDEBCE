#!/usr/bin/env node
'use strict';

/**
 * Development seed script – inserts sample employees and attendance records.
 * Run: node src/data/seeders/seed.js
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize } = require('../database');
const { Employee, Attendance } = require('../models');
const logger = require('../../utils/logger');

async function seed() {
  try {
    await sequelize.authenticate();

    // Sync tables
    await Employee.sync({ alter: true });
    await Attendance.sync({ alter: true });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const employees = await Employee.bulkCreate(
      [
        {
          employeeCode: 'EMP-001',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@example.com',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          expectedHoursPerDay: 8,
          hireDate: '2022-01-10',
          passwordHash,
        },
        {
          employeeCode: 'EMP-002',
          firstName: 'Bob',
          lastName: 'Williams',
          email: 'bob.williams@example.com',
          department: 'Marketing',
          jobTitle: 'Marketing Specialist',
          expectedHoursPerDay: 8,
          hireDate: '2021-06-15',
          passwordHash,
        },
        {
          employeeCode: 'EMP-003',
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol.davis@example.com',
          department: 'HR',
          jobTitle: 'HR Manager',
          expectedHoursPerDay: 8,
          hireDate: '2020-03-01',
          passwordHash,
        },
      ],
      { ignoreDuplicates: true }
    );

    // Seed last 3 days of attendance for the first employee
    const today = new Date();
    for (let i = 2; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const checkIn = new Date(date);
      checkIn.setHours(9, 0, 0, 0);

      const checkOut = new Date(date);
      checkOut.setHours(17, 30, 0, 0);

      await Attendance.findOrCreate({
        where: { employeeId: employees[0].id, date: dateStr },
        defaults: {
          checkIn,
          checkOut,
          workedHoursStored: 8.5,
          status: 'present',
        },
      });
    }

    logger.info(`Seeded ${employees.length} employees and sample attendance records.`);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
