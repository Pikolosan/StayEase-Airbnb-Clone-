// routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Listing = require('../models/listing');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Display the booking page
router.get('/booking/:id', async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).send('Listing not found');
    }
    res.render('listings/booking.ejs', { listingId: id, listing });
});

// Create a new booking
// Create a new booking
router.post('/', async (req, res) => {
    const { listingId, startDate, endDate } = req.body;

    // Convert dates from string to Date objects for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start >= end) {
        req.flash("error", "Start date must be before end date.");
        return res.redirect(`/bookings/booking/${listingId}`); // Redirect back to booking page with error
    }

    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect(`/bookings/booking/${listingId}`);
        }

        // Calculate the total cost based on the number of days and listing price
        const totalCost = (end - start) / (1000 * 3600 * 24) * listing.price; // Price is assumed to be per night

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${listing.title} Booking`,
                        },
                        unit_amount: totalCost * 100, // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/bookings/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/listings/${listingId}`,
        });

        // After Stripe payment success, create a booking in the database
        // The session_id will be used to verify the payment in the /complete route (in this case, you can just use my-bookings)
        
        // You can save the booking in the database immediately after the session creation:
        const booking = new Booking({
            listingId,
            userId: req.user._id, // Ensure the user is logged in
            startDate: start,
            endDate: end,
            status: 'pending', // Default status before payment confirmation
            totalCost, // Store the cost for reference
            stripeSessionId: session.id, // Store the Stripe session ID for later verification
        });

        await booking.save(); // Save the booking to the database

        req.flash("success", "Booking confirmed! Please proceed with the payment.");
        res.redirect(session.url); // Redirect user to Stripe checkout

    } catch (error) {
        console.error(error);
        req.flash("error", "There was an issue with the booking process.");
        res.redirect(`/bookings/booking/${listingId}`);
    }
});


// Handle successful payment and create a booking
router.get('/my-bookings', async (req, res) => {
    if (!req.user) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    try {
        const bookings = await Booking.find({ userId: req.user._id }).populate('listingId');
        console.log(bookings);  // Log the populated bookings data to check
        res.render('listings/myBookings', { bookings });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Could not retrieve bookings.');
        res.redirect('/listings');
    }
});

// Handle Stripe payment completion
router.get('/complete', async (req, res) => {
    const { booking_id } = req.query;
    if (!booking_id) {
        req.flash("error", "Booking ID missing.");
        return res.redirect('/bookings/my-bookings');
    }

    try {
        // Retrieve the booking and mark it as confirmed
        const booking = await Booking.findById(booking_id);
        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect('/bookings/my-bookings');
        }

        // Confirm the booking (you can set a payment status here if needed)
        booking.status = 'confirmed'; // Example status update
        await booking.save();

        req.flash("success", "Booking confirmed and payment successful!");
        res.redirect('/bookings/my-bookings');
    } catch (error) {
        console.error(error);
        req.flash("error", "There was an issue confirming your booking.");
        res.redirect('/bookings/my-bookings');
    }
});

// Cancel the booking
router.delete('/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        await Booking.findByIdAndDelete(bookingId);
        req.flash("success", "Booking canceled successfully.");
        res.redirect('/bookings/my-bookings');
    } catch (error) {
        console.error(error);
        req.flash("error", "There was a problem canceling your booking.");
        res.redirect('/bookings/my-bookings');
    }
});

module.exports = router;
