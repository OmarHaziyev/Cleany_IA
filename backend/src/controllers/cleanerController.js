import Cleaner from "../models/cleaner.js";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to get standard cleaner pipeline stages
const getCleanerPipelineStages = () => [
  {
    $lookup: {
      from: 'requests',
      localField: '_id',
      foreignField: 'cleaner',
      as: 'completedJobs',
      pipeline: [
        {
          $match: {
            status: 'completed',
            rating: { $exists: true, $ne: null }
          }
        },
        {
          $project: {
            rating: 1,
            review: 1
          }
        }
      ]
    }
  },
  {
    $addFields: {
      // Combine job ratings with initial stars
      averageRating: {
        $cond: {
          if: { $gt: [{ $size: '$completedJobs' }, 0] },
          then: { $avg: '$completedJobs.rating' },
          else: '$stars'
        }
      },
      // Combine job reviews with initial comments
      allReviews: {
        $concatArrays: [
          {
            $map: {
              input: '$completedJobs',
              as: 'job',
              in: {
                rating: '$$job.rating',
                review: '$$job.review',
                source: 'job'
              }
            }
          },
          {
            $map: {
              input: { $ifNull: ['$comments', []] },
              as: 'comment',
              in: {
                rating: '$stars',
                review: '$$comment',
                source: 'initial'
              }
            }
          }
        ]
      }
    }
  },
  {
    $addFields: {
      totalReviews: { 
        $add: [
          { $size: '$completedJobs' },
          { $size: { $ifNull: ['$comments', []] } }
        ]
      }
    }
  },
  {
    $project: {
      completedJobs: 0,
      password: 0
    }
  }
];

export async function getAllCleanersForDashboard(req, res){ // tested
   try {
    const page = parseInt(req.query.page) || 1; // Page number (1-based)
    const CLEANERS_PER_PAGE = 9; // Show 9 cleaners per page (3x3 grid)
    const sortBy = req.query.sort || 'rating'; // Default sort by rating
    
    // First, get the total count of cleaners
    const totalCount = await Cleaner.countDocuments();

    // Determine sort order
    let sortStage = {};
    switch(sortBy) {
      case 'rating':
        sortStage = { $sort: { averageRating: -1 } };
        break;
      case 'price_high':
        sortStage = { $sort: { hourlyPrice: 1 } };
        break;
      case 'price_low':
        sortStage = { $sort: { hourlyPrice: -1 } };
        break;
    }
    
    const cleaners = await Cleaner.aggregate([
      // First add the lookup and fields we need for sorting
      {
        $lookup: {
          from: 'requests',
          localField: '_id',
          foreignField: 'cleaner',
          as: 'completedJobs',
          pipeline: [
            {
              $match: {
                status: 'completed',
                rating: { $exists: true }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$completedJobs' }, 0] },
              then: { $avg: '$completedJobs.rating' },
              else: '$stars'
            }
          }
        }
      },
      // Apply sorting
      sortStage,
      // Then paginate
      { $skip: (page - 1) * CLEANERS_PER_PAGE },
      { $limit: CLEANERS_PER_PAGE },
      // Add standard cleaner processing stages
      ...getCleanerPipelineStages(),
      {
        $lookup: {
          from: 'requests',
          localField: '_id',
          foreignField: 'cleaner',
          as: 'completedJobs',
          pipeline: [
            {
              $match: {
                status: 'completed',
                rating: { $exists: true, $ne: null }
              }
            },
            {
              $project: {
                rating: 1,
                review: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          // Include both job-based ratings and direct stars
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$completedJobs' }, 0] },
              then: { $avg: '$completedJobs.rating' },
              else: { $ifNull: ['$stars', 0] } // Use stars field if no job ratings
            }
          },
          // Include both job reviews and direct comments
          totalReviews: {
            $add: [
              { $size: '$completedJobs' },
              { $size: { $ifNull: ['$comments', []] } }
            ]
          },
          reviews: {
            $concatArrays: [
              {
                $map: {
                  input: { $slice: ['$completedJobs', 5] },
                  as: 'job',
                  in: {
                    rating: '$$job.rating',
                    review: '$$job.review',
                    source: 'job'
                  }
                }
              },
              {
                $map: {
                  input: { $ifNull: ['$comments', []] },
                  as: 'comment',
                  in: {
                    rating: { $ifNull: ['$stars', 5] },
                    review: '$$comment',
                    source: 'direct'
                  }
                }
              }
            ]
          }
        }
      },
      {
        $project: {
          completedJobs: 0 // Remove the temporary field
        }
      }
    ]);

    // If no cleaners are found
    if (!cleaners.length) {
      return res.status(404).json({ message: 'No cleaners found' });
    }
    
    // Return cleaners with pagination info
    res.json({
      cleaners,
      pagination: {
        page,
        totalCount,
        hasMore: (page + 1) * CLEANERS_PER_PAGE < totalCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function filterCleaners(req, res) { // tested
  try {
    const {
      price,
      rating,
      age,
      gender,
      service
    } = req.body;

    // Build the initial match pipeline
    const matchStage = {};
    const pipeline = [];

    // Basic field filters
    if (price) {
      const [minPrice, maxPrice] = price.split('-');
      matchStage.hourlyPrice = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    }

    if (age) {
      const [minAge, maxAge] = age.split('-');
      matchStage.age = { $gte: Number(minAge), $lte: Number(maxAge) };
    }

    if (gender) {
      matchStage.gender = gender;
    }

    if (service) {
      matchStage.service = service;
    }

    // Add initial match stage if there are basic filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add lookup for ratings
    pipeline.push({
      $lookup: {
        from: 'requests',
        localField: '_id',
        foreignField: 'cleaner',
        as: 'completedJobs',
        pipeline: [
          {
            $match: {
              status: 'completed',
              rating: { $exists: true, $ne: null }
            }
          },
          {
            $project: {
              rating: 1,
              review: 1
            }
          }
        ]
      }
    });

    // Add fields for rating calculation
    pipeline.push({
      $addFields: {
        averageRating: {
          $cond: {
            if: { $gt: [{ $size: '$completedJobs' }, 0] },
            then: { $avg: '$completedJobs.rating' },
            else: 0
          }
        },
        totalReviews: { $size: '$completedJobs' },
        reviews: {
          $map: {
            input: { $slice: ['$completedJobs', 5] },
            as: 'job',
            in: {
              rating: '$job.rating',
              review: '$job.review'
            }
          }
        }
      }
    });

    // Add rating filter after calculating average rating
    if (rating) {
      const [minRating, maxRating] = rating.split('-');
      pipeline.push({
        $match: {
          averageRating: { $gte: Number(minRating), $lte: Number(maxRating) }
        }
      });
    }

    // Get the sort order from the query params
    const sortBy = req.query.sort || 'rating';
    let sortStage = {};
    switch(sortBy) {
      case 'rating':
        sortStage = { $sort: { averageRating: -1 } };
        break;
      case 'price_high':
        sortStage = { $sort: { hourlyPrice: -1 } };
        break;
      case 'price_low':
        sortStage = { $sort: { hourlyPrice: 1 } };
        break;
    }
    pipeline.push(sortStage);

    // Clean up the output
    pipeline.push({
      $project: {
        completedJobs: 0
      }
    });

    // Execute the aggregation pipeline
    const cleaners = await Cleaner.aggregate(pipeline);

    if (!cleaners.length) {
      return res.status(404).json({ message: 'No cleaners found matching your filters.' });
    }

    res.json(cleaners);
  } catch (err) {
    console.error("Error in filterCleaners controller", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function getCleanerByID(req, res) { //tested
    try{
    const cleanerId = req.params.id;
    
    // Get cleaner with detailed ratings and reviews
    const cleanerData = await Cleaner.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(cleanerId) } },
      {
        $lookup: {
          from: 'requests',
          localField: '_id',
          foreignField: 'cleaner',
          as: 'completedJobs',
          pipeline: [
            {
              $match: {
                status: 'completed',
                rating: { $exists: true, $ne: null }
              }
            },
            {
              $lookup: {
                from: 'clients',
                localField: 'client',
                foreignField: '_id',
                as: 'clientInfo',
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      _id: 1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                clientInfo: { $arrayElemAt: ['$clientInfo', 0] }
              }
            },
            {
              $project: {
                rating: 1,
                review: 1,
                date: 1,
                service: 1,
                createdAt: 1,
                clientName: '$clientInfo.name'
              }
            }
          ]
        }
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$completedJobs' }, 0] },
              then: { $avg: '$completedJobs.rating' },
              else: 0
            }
          },
          totalReviews: { $size: '$completedJobs' },
          totalCompletedJobs: { $size: '$completedJobs' },
          reviews: {
            $slice: [
              {
                $sortArray: {
                  input: '$completedJobs',
                  sortBy: { createdAt: -1 }
                }
              },
              10
            ]
          }
        }
      },
      {
        $project: {
          completedJobs: 0 // Remove the temporary field
        }
      }
    ]);

    if (!cleanerData.length) {
      return res.status(404).json({message: "Cleaner not found!"});
    }

    res.json(cleanerData[0]);
    }
    catch(err){
        console.error("Error in getCleanerByID controller", err);
        res.status(500).json({message: 'Server error'});
    }
};

export async function updateCleaner(req, res) { //tested
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedCleaner = await Cleaner.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedCleaner) {
      return res.status(404).json({ message: 'Cleaner not found' });
    }

    res.json(updatedCleaner);
  } catch (err) {
    console.error("Error in updateCleaner controller", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function createCleaner(req, res) { 
    try {
    const { 
      name, 
      email, 
      password, 
      phoneNumber, 
      gender, 
      age, 
      service, 
      schedule, 
      scheduleType,
      hourlyPrice,
      username
    } = req.body;

    // Validation
    if (!name || !email || !password || !phoneNumber || !service || !gender || !age || !hourlyPrice || !schedule || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Age validation
    if (age < 18 || age > 80) {
      return res.status(400).json({ message: 'Age must be between 18 and 80' });
    }

    // Price validation
    if (hourlyPrice < 5) {
      return res.status(400).json({ message: 'Hourly price must be at least $5' });
    }

    // Schedule validation - at least one day must be available
    const hasAvailableDay = Object.values(schedule).some(day => day.available);
    if (!hasAvailableDay) {
      return res.status(400).json({ message: 'At least one day must be available in your schedule' });
    }

    // Check if cleaner already exists with this username OR email
    const existingCleaner = await Cleaner.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingCleaner) {
      if (existingCleaner.username === username) {
        return res.status(400).json({ 
          message: 'Username already exists. Please choose a different username.' 
        });
      }
      if (existingCleaner.email === email) {
        return res.status(400).json({ 
          message: 'Email already exists. Please use a different email.' 
        });
      }
    }

    // Hash the password before saving it to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const cleaner = new Cleaner({
      username, // Use the user-provided username directly
      password: hashedPassword,
      name,
      phoneNumber,
      email,
      gender,
      age: parseInt(age),
      service: Array.isArray(service) ? service : [service],
      schedule,
      scheduleType: scheduleType || 'NORMAL',
      hourlyPrice: parseFloat(hourlyPrice),
    });

    const savedCleaner = await cleaner.save();
    
    // Remove password from response
    const cleanerResponse = savedCleaner.toObject();
    delete cleanerResponse.password;
    
    res.status(201).json(cleanerResponse);
  } catch (err) {
    console.error('Error in createCleaner controller', err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation error: ' + errors.join(', ')
      });
    }
    
    if (err.code === 11000) {
      // Handle duplicate key errors more specifically
      const duplicateField = Object.keys(err.keyValue)[0];
      return res.status(400).json({ 
        message: `${duplicateField} already exists. Please choose a different ${duplicateField}.`
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

export async function deleteCleaner(req, res) { //tested
  const { id } = req.params;

  try {
    const deletedCleaner = await Cleaner.findByIdAndDelete(id);

    if (!deletedCleaner) {
      return res.status(404).json({ message: 'Cleaner not found' });
    }

    res.json({ message: 'Cleaner deleted successfully' });
  } catch (err) {
    console.error("Error in deleteCleaner controller", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export async function loginCleaner(req, res) {
  const { username, password } = req.body;

  try {
    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find cleaner by username or email
    const cleaner = await Cleaner.findOne({ 
      $or: [{ username }, { email: username }]
    });

    if (!cleaner) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, cleaner.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token 
    const token = jwt.sign(
      { 
        id: cleaner._id,
        role: 'cleaner',
        username: cleaner.username
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    );

    // Remove password from cleaner object before sending response
    const cleanerResponse = cleaner.toObject();
    delete cleanerResponse.password;

    res.json({ 
      message: 'Login successful',
      token, 
      cleaner: cleanerResponse 
    });

  } catch (err) {
    console.error('Error in loginCleaner controller', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get current cleaner's profile (for authenticated cleaner)
export async function getMyProfile(req, res) {
  try {
    const cleanerId = req.user.id;
    const cleaner = await Cleaner.findById(cleanerId).select('-password');
    
    if (!cleaner) {
      return res.status(404).json({ message: 'Cleaner not found' });
    }
    
    res.json(cleaner);
  } catch (err) {
    console.error('Error in getMyProfile controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current cleaner's profile (for authenticated cleaner)
export async function updateMyProfile(req, res) {
  try {
    const cleanerId = req.user.id;
    const updateData = req.body;

    // Remove password from updateData if it exists
    delete updateData.password;
    
    // Find and update the cleaner
    const updatedCleaner = await Cleaner.findByIdAndUpdate(
      cleanerId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedCleaner) {
      return res.status(404).json({ message: 'Cleaner not found' });
    }
    
    res.json(updatedCleaner);
  } catch (err) {
    console.error('Error in updateMyProfile controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete current cleaner's account (for authenticated cleaner)
export async function deleteMyAccount(req, res) {
  try {
    const cleanerId = req.user.id;
    
    const deletedCleaner = await Cleaner.findByIdAndDelete(cleanerId);
    
    if (!deletedCleaner) {
      return res.status(404).json({ message: 'Cleaner account not found' });
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error in deleteMyAccount controller', err);
    res.status(500).json({ message: 'Server error' });
  }
};