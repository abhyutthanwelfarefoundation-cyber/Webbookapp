const Visit = require('../models/Visit');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { uploadToS3 } = require('../services/s3Service');

const SUPABASE = 'https://adoiilauzxxffnwlnono.supabase.co/storage/v1/object/public/digital-books';

// @POST /api/visits — agent logs a visit
exports.createVisit = catchAsync(async (req, res, next) => {
  const { schoolName, principalName, teacherName, designation, phoneNumber, booksShown, notes, outcome, visitDate } = req.body;

  if (!schoolName) return next(new AppError('School name is required.', 400));

  let selfieKey = null;
  if (req.file) {
    selfieKey = `visits/${req.user._id}/${Date.now()}-selfie.jpg`;
    await uploadToS3(selfieKey, req.file.buffer, req.file.mimetype);
  }

const visit = await Visit.create({
    agentId: req.user._id,
    schoolName, principalName, teacherName,
    designation, phoneNumber, notes, outcome,
    booksShown: booksShown ? JSON.parse(booksShown) : [],
    selfieKey,
    visitDate: visitDate || new Date(),
    location: {
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
      address: req.body.address || ''
    }
  });
  
  const populated = await visit.populate('agentId', 'name email');

  const visitObj = populated.toObject();
  if (selfieKey) visitObj.selfieUrl = `${SUPABASE}/${selfieKey}`;

  sendResponse(res, 201, { visit: visitObj }, 'Visit logged successfully');
});

// @GET /api/visits — agent sees own, admin sees all
exports.getVisits = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, agentId } = req.query;
  const skip = (page - 1) * limit;

  const query = req.user.role === 'admin'
    ? agentId ? { agentId } : {}
    : { agentId: req.user._id };

  const [visits, total] = await Promise.all([
    Visit.find(query)
      .populate('agentId', 'name email')
      .sort('-visitDate')
      .skip(skip)
      .limit(Number(limit)),
    Visit.countDocuments(query)
  ]);

  const visitsWithUrls = visits.map(v => {
    const obj = v.toObject();
    if (v.selfieKey) obj.selfieUrl = `${SUPABASE}/${v.selfieKey}`;
    return obj;
  });

  sendResponse(res, 200, { visits: visitsWithUrls, total, page: Number(page) });
});

// @GET /api/visits/stats — admin dashboard stats
exports.getVisitStats = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [total, todayCount, weekCount, outcomes] = await Promise.all([
    Visit.countDocuments(),
    Visit.countDocuments({ visitDate: { $gte: today } }),
    Visit.countDocuments({ visitDate: { $gte: weekAgo } }),
    Visit.aggregate([
      { $group: { _id: '$outcome', count: { $sum: 1 } } }
    ])
  ]);

  sendResponse(res, 200, { total, todayCount, weekCount, outcomes });
});

// @DELETE /api/visits/:id — agent deletes own, admin deletes any
exports.deleteVisit = catchAsync(async (req, res, next) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) return next(new AppError('Visit not found.', 404));

  if (req.user.role !== 'admin' && String(visit.agentId) !== String(req.user._id)) {
    return next(new AppError('Not authorised.', 403));
  }

  await visit.deleteOne();
  sendResponse(res, 200, {}, 'Visit deleted');
});

// @PUT /api/visits/:id
exports.updateVisit = catchAsync(async (req, res, next) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) return next(new AppError('Visit not found.', 404));

  if (req.user.role !== 'admin' && String(visit.agentId) !== String(req.user._id)) {
    return next(new AppError('Not authorised.', 403));
  }

  const { schoolName, principalName, teacherName, designation, phoneNumber, notes, outcome, visitDate } = req.body;

  let selfieKey = visit.selfieKey;
  if (req.file) {
    selfieKey = `visits/${visit.agentId}/${Date.now()}-selfie.jpg`;
    await uploadToS3(selfieKey, req.file.buffer, req.file.mimetype);
  }

  const updated = await Visit.findByIdAndUpdate(
    req.params.id,
    {  schoolName, principalName, teacherName, designation, phoneNumber, notes, outcome, visitDate, selfieKey,
      location: {
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        address: req.body.address || ''
      }},
    { new: true, runValidators: true }
  ).populate('agentId', 'name email');

  const obj = updated.toObject();
  if (selfieKey) obj.selfieUrl = `${SUPABASE}/${selfieKey}`;

  sendResponse(res, 200, { visit: obj }, 'Visit updated');
});