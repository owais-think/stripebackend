require('dotenv').config({path:'./.env'})
const bodyParser = require('body-parser');
const e = require('express');
const express=require('express')
const app=express()
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = "whsec_kTn4uNQCqAqXfLAby9CumMmaj1LOL7j1";

// (async()=>{
// console.log(await stripe.plans.list());
// })();

// Use JSON parser for all non-webhook routes
app.use(
    bodyParser.json({
      verify: (req, res, buf) => {
        const url = req.originalUrl;
        if (url.startsWith('/webhook')) {
          req.rawBody = buf.toString();
        }
      }
    })
  );

app.get('/',(req,res)=>{
    res.send('hello owais')
})

app.get('/public-keys',(req,res)=>{
    res.send({key:process.env.STRIPE_PUBLISHABLE_KEY})
})

app.post('/my-route',(req,res)=>{
    res.send(req.body)
})

// Stripe requires the raw body to construct the event

//first video wala webhook ka code

// app.post("/webhook",(req,res)=>{
//     const event=req.body
//     switch(event.type){
//         case 'checkout.session.completed':
//             const session=event.data.object;
//             console.log("Checkout Session Id: ",session.id)
//             break;
//             case 'payment_intent.created':
//             const paymentIntent=event.data.object;
//             console.log("Payment Intent Created: ",paymentIntent.id)
//             break;
//             default:
//                 console.log("unknow event type" + event.type)
//     }
//     res.send('success')
// })

app.post('/create-payment-intent',async(req,res)=>{
    const {paymentMethodType,currency}=req.body
    try{
    const paymentIntent=await stripe.paymentIntents.create({
        amount:1999,
        currency:currency,
        payment_method_types:[paymentMethodType]
    })
    res.json({clientSecret:paymentIntent.client_secret})
}
catch{
    res.status(400).json({error:{message:e.message}})
}
})

//second video wala webhook ka code

// app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
//     const sig = request.headers['stripe-signature'];
  
//     let event;
  
//     try {
//       event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//       response.status(400).send(`Webhook Error: ${err.message}`);
//       return;
//     }
  
//     // Handle the event
//     switch (event.type) {
//       case 'payment_intent.succeeded':
//         const paymentIntent = event.data.object;
//         // Then define and call a function to handle the event payment_intent.succeeded
//         console.log(`[${event.id}] PaymentIntent(${paymentIntent.id}): ${paymentIntent.status}`)
//         break;
//       // ... handle other event types
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }
  
//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
//   });


  //third webhook

  app.post('/webhook', async (req, res) => {
    let data, eventType;
  
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // we can retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }
  
    if (eventType === 'payment_intent.succeeded') {
      // Funds have been captured
      // Fulfill any orders, e-mail receipts, etc
      // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
      console.log('💰 Payment captured!');
    } else if (eventType === 'payment_intent.payment_failed') {
      console.log('❌ Payment failed.');
    }
    res.sendStatus(200);
  });

  app.post('/payment-sheet', async (req, res) => {
    // Use an existing Customer ID if this is a returning customer.
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      {customer: customer.id},
      {apiVersion: '2020-08-27'}
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: 'usd',
      customer: customer.id,
    });
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id
    });
  });

app.listen(3300,()=>{console.log(`server started at port 3300`)})