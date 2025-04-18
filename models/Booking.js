const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the booking schema
const bookingSchema = new Schema({
    listingId: {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Use mongoose.models.Booking to prevent model overwriting
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = Booking;
