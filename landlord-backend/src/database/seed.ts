import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import pool from './connection.js';

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Seeding database...');

    // Create a demo landlord
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ['demo@vacancyradar.com', hashedPassword, 'John', 'Doe', '555-0123', 'Doe Properties LLC']
    );
    const landlordId = userResult.rows[0].id;
    console.log('✓ Demo landlord created');

    // Create properties
    const property1 = await client.query(
      `INSERT INTO properties (landlord_id, name, address, city, state, zip_code, property_type, year_built, total_units, description, amenities, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        landlordId,
        'Sunset Apartments',
        '123 Main Street',
        'Los Angeles',
        'CA',
        '90001',
        'apartment',
        2018,
        24,
        'Modern apartment complex with stunning views',
        JSON.stringify(['Pool', 'Gym', 'Parking', 'Laundry']),
        null
      ]
    );
    const property1Id = property1.rows[0].id;

    const property2 = await client.query(
      `INSERT INTO properties (landlord_id, name, address, city, state, zip_code, property_type, year_built, total_units, description, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        landlordId,
        'Oak Grove Townhomes',
        '456 Oak Avenue',
        'San Diego',
        'CA',
        '92101',
        'townhouse',
        2020,
        12,
        'Luxury townhomes in quiet neighborhood',
        JSON.stringify(['Garage', 'Patio', 'Garden'])
      ]
    );
    const property2Id = property2.rows[0].id;
    console.log('✓ Properties created');

    // Create units
    const unitsData = [
      // Sunset Apartments units
      { property_id: property1Id, unit_number: '101', bedrooms: 1, bathrooms: 1, square_feet: 650, rent_amount: 1500, deposit_amount: 1500, status: 'vacant', available_date: '2026-04-01' },
      { property_id: property1Id, unit_number: '102', bedrooms: 1, bathrooms: 1, square_feet: 680, rent_amount: 1550, deposit_amount: 1550, status: 'occupied', available_date: null },
      { property_id: property1Id, unit_number: '201', bedrooms: 2, bathrooms: 2, square_feet: 950, rent_amount: 2200, deposit_amount: 2200, status: 'vacant', available_date: '2026-03-15' },
      { property_id: property1Id, unit_number: '202', bedrooms: 2, bathrooms: 2, square_feet: 980, rent_amount: 2300, deposit_amount: 2300, status: 'pending', available_date: '2026-04-01' },
      { property_id: property1Id, unit_number: '301', bedrooms: 3, bathrooms: 2.5, square_feet: 1250, rent_amount: 2800, deposit_amount: 2800, status: 'occupied', available_date: null },
      
      // Oak Grove Townhomes units
      { property_id: property2Id, unit_number: '1', bedrooms: 3, bathrooms: 2.5, square_feet: 1600, rent_amount: 3200, deposit_amount: 3200, status: 'vacant', available_date: '2026-03-20' },
      { property_id: property2Id, unit_number: '2', bedrooms: 3, bathrooms: 2.5, square_feet: 1600, rent_amount: 3200, deposit_amount: 3200, status: 'occupied', available_date: null },
      { property_id: property2Id, unit_number: '3', bedrooms: 4, bathrooms: 3, square_feet: 2000, rent_amount: 3800, deposit_amount: 3800, status: 'vacant', available_date: '2026-03-10' },
    ];

    const unitIds = [];
    for (const unit of unitsData) {
      const result = await client.query(
        `INSERT INTO units (property_id, unit_number, bedrooms, bathrooms, square_feet, rent_amount, deposit_amount, status, available_date, amenities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          unit.property_id,
          unit.unit_number,
          unit.bedrooms,
          unit.bathrooms,
          unit.square_feet,
          unit.rent_amount,
          unit.deposit_amount,
          unit.status,
          unit.available_date,
          JSON.stringify(['Dishwasher', 'AC', 'Heating'])
        ]
      );
      unitIds.push(result.rows[0].id);
    }
    console.log('✓ Units created');

    // Create tenants
    const tenant1 = await client.query(
      `INSERT INTO tenants (landlord_id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, move_in_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [landlordId, 'Sarah', 'Johnson', 'sarah.j@email.com', '555-1001', 'Mike Johnson', '555-1002', '2025-06-01', 'active']
    );

    const tenant2 = await client.query(
      `INSERT INTO tenants (landlord_id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, move_in_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [landlordId, 'Michael', 'Chen', 'michael.chen@email.com', '555-2001', 'Lisa Chen', '555-2002', '2025-08-15', 'active']
    );
    console.log('✓ Tenants created');

    // Create leases
    await client.query(
      `INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, payment_due_day, lease_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [unitIds[1], tenant1.rows[0].id, '2025-06-01', '2026-05-31', 1550, 1550, 1, 'fixed', 'active']
    );

    await client.query(
      `INSERT INTO leases (unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, payment_due_day, lease_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [unitIds[6], tenant2.rows[0].id, '2025-08-15', '2026-08-14', 3200, 3200, 15, 'fixed', 'active']
    );
    console.log('✓ Leases created');

    // Create applications
    await client.query(
      `INSERT INTO applications (unit_id, applicant_name, applicant_email, applicant_phone, current_address, employment_status, employer_name, annual_income, move_in_date, num_occupants, has_pets, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [unitIds[0], 'Emily Davis', 'emily.d@email.com', '555-3001', '789 Elm St, LA, CA', 'employed', 'Tech Corp', 75000, '2026-04-01', 1, false, 'pending']
    );

    await client.query(
      `INSERT INTO applications (unit_id, applicant_name, applicant_email, applicant_phone, current_address, employment_status, employer_name, annual_income, move_in_date, num_occupants, has_pets, pet_details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [unitIds[2], 'Robert Wilson', 'robert.w@email.com', '555-4001', '321 Pine St, LA, CA', 'employed', 'Design Studio', 85000, '2026-03-15', 2, true, '1 small dog', 'under_review']
    );
    console.log('✓ Applications created');

    // Create notifications
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, is_read, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [landlordId, 'application', 'New Application Received', 'Emily Davis has applied for Unit 101 at Sunset Apartments', false, '/applications']
    );

    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, is_read, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [landlordId, 'application', 'Application Under Review', 'Robert Wilson\'s application is ready for review', false, '/applications']
    );
    console.log('✓ Notifications created');

    console.log('✓ Database seeding completed successfully');
    console.log('\nDemo Account:');
    console.log('Email: demo@vacancyradar.com');
    console.log('Password: demo123');
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed if executed directly – Windows‑compatible check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedData;