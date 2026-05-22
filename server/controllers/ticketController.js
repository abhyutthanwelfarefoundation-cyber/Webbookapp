const Ticket = require('../models/Ticket');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// @POST /api/tickets — agent creates ticket
exports.createTicket = catchAsync(async (req, res, next) => {
  const { type, subject, message } = req.body;
  if (!type || !subject || !message) return next(new AppError('All fields required.', 400));

  const ticket = await Ticket.create({
    agentId: req.user._id,
    type, subject, message
  });

  sendResponse(res, 201, { ticket }, 'Ticket submitted successfully');
});

// @GET /api/tickets — agent sees own tickets, admin sees all
exports.getTickets = catchAsync(async (req, res) => {
  const query = req.user.role === 'admin'
    ? {}
    : { agentId: req.user._id };

  const tickets = await Ticket.find(query)
    .populate('agentId', 'name email')
    .sort('-createdAt');

  sendResponse(res, 200, { tickets, count: tickets.length });
});

// @PUT /api/tickets/:id — admin resolves ticket
exports.updateTicket = catchAsync(async (req, res, next) => {
  // Only admin can update tickets
  if (req.user.role !== 'admin') {
    return next(new AppError('You do not have permission for this action.', 403));
  }

  const { status, adminNote } = req.body;

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    {
      status,
      adminNote,
      ...(status === 'resolved' && { resolvedAt: new Date() })
    },
    { new: true }
  ).populate('agentId', 'name email');

  if (!ticket) return next(new AppError('Ticket not found.', 404));
  sendResponse(res, 200, { ticket }, 'Ticket updated');
});

// @DELETE /api/tickets/:id — admin only
exports.deleteTicket = catchAsync(async (req, res, next) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found.', 404));
  sendResponse(res, 200, {}, 'Ticket deleted');
});