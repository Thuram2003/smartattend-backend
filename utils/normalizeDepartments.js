import User from '../models/User.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Normalize department name (trim whitespace and convert to Title Case)
 */
const normalizeDepartment = (dept) => {
  if (!dept || typeof dept !== 'string') return 'Not Assigned'
  
  // Trim whitespace and normalize to Title Case
  const normalized = dept.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  return normalized || 'Not Assigned'
}

/**
 * Script to normalize all department names in the database
 */
const normalizeAllDepartments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Get all users (students and lecturers)
    const users = await User.find({
      role: { $in: ['student', 'lecturer'] },
      department: { $exists: true, $ne: null }
    })
    
    console.log(`\n📊 Found ${users.length} users with departments`)
    
    // Track changes
    let updatedCount = 0
    const departmentChanges = {}
    
    // Process each user
    for (const user of users) {
      const originalDept = user.department
      const normalizedDept = normalizeDepartment(originalDept)
      
      if (originalDept !== normalizedDept) {
        // Track the change
        if (!departmentChanges[originalDept]) {
          departmentChanges[originalDept] = normalizedDept
        }
        
        // Update the user
        user.department = normalizedDept
        await user.save()
        updatedCount++
        
        console.log(`  ✏️  Updated: "${originalDept}" → "${normalizedDept}" (${user.fullName})`)
      }
    }
    
    // Summary
    console.log(`\n✅ Migration Complete!`)
    console.log(`   Updated ${updatedCount} user(s)`)
    console.log(`\n📋 Department Mappings:`)
    
    if (Object.keys(departmentChanges).length === 0) {
      console.log('   No changes needed - all departments are already normalized!')
    } else {
      Object.entries(departmentChanges).forEach(([old, normalized]) => {
        console.log(`   "${old}" → "${normalized}"`)
      })
    }
    
    // Get unique departments after normalization
    const uniqueDepartments = await User.distinct('department', {
      role: { $in: ['student', 'lecturer'] }
    })
    
    console.log(`\n🎯 Unique Departments (${uniqueDepartments.length}):`)
    uniqueDepartments.sort().forEach(dept => {
      console.log(`   - ${dept}`)
    })
    
    // Disconnect
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB\n')
    
  } catch (error) {
    console.error('\n❌ Migration Error:', error)
    process.exit(1)
  }
}

// Run the migration
normalizeAllDepartments()
