require('dotenv').config(); // Loads MONGO_URI from .env

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Stripe = require('stripe')(process.env.STRIPE_KEY);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

connectDB()

const issueSchema = new mongoose.Schema({
  type: { type: String, required: true },
  count: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
});

const Issue = mongoose.model('Issue', issueSchema);

app.post(
  "/issues", async (req, res) => {
    try {

    const type = req.body.type;

    if (!type) {
      return res.status(400).json({ error: "Se requiere el parametro type" })
    }

    let result = {};

      result = await Issue.findOneAndUpdate(
        { type },
        { $inc: { count: 1 }, $set: { timestamp: new Date() } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      return res.status(201).json({"resultado":result})
    }
    catch (e) {
      res.status(500).json({ "error": e.message })
    }
  }
)

app.get(
  "/issues/:type", async (req, res) => {
    
    try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ error: "Se requiere el parametro type" })
    }
    let result = {};
    
      result = await Issue.findOne(
        { type }
      )

      if(!result)
        return res.status(400).json( {"error":"No se encontro un elemento con ese type"})

      return res.status(200).json({"resultado":{count:result.count,timestamp:result.timestamp }} )
    }
    catch (e) {
      res.status(500).json({ "error": e.message })
    }
  }
)

app.get(
  "/ratio", async (req, res) => {

    try {
      let { data } = req.body

      if (!data)
        return res.status(400).json({ "error": "Se requiere un array valido" })

      distanciaTotal = 0
      tiempoTotal = 0

      for (const { distancia, tiempo } of data) {

        if (!distancia || ! tiempo ) {
          return res.status(400).json({ "error": "las propiedades distancia y tiempo son requeridas" })
        }

        if (typeof distancia !== "number" || typeof tiempo !== "number") {
          return res.status(400).json({ "error": "las propiedades distancia y tiempo deben ser numeros" })
        }

        distanciaTotal += distancia
        tiempoTotal += tiempo
      }

      return res.status(200).json({ resultado: (distanciaTotal / tiempoTotal).toFixed(2) })
    }
    catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
)

app.get(
  "/checkout", async (req, res, next) => {
    console.log("entro a check", Stripe)
    const stripe = Stripe
    try {
      if (!stripe) return res.status(500).json({ error: 'Stripe no está configurado. Agrega STRIPE_KEY en .env (modo test).' });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: { name: 'Producto prueba' },
              unit_amount: 1000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: (req.protocol + '://' + req.get('host')) + '/success',
        cancel_url: (req.protocol + '://' + req.get('host')) + '/cancel',
      });

      return res.json({ checkout_url: session.url });
    }
    catch (e) {
      return res.status(500).json({ "error": e.message })
    }

  }
)

app.get(
  "/ratio_segunda_variante", async (req, res) => {

    try {
      
      let data = req.query.data

      data = JSON.parse(data)

      if (!data)
        return res.status(400).json({ "error": "Se requiere un array valido" })

      distanciaTotal = 0
      tiempoTotal = 0

      for (const { distancia, tiempo } of data) {

        if (!distancia || ! tiempo ) {
          return res.status(400).json({ "error": "las propiedades distancia y tiempo son requeridas" })
        }

        if (typeof distancia !== "number" || typeof tiempo !== "number") {
          return res.status(400).json({ "error": "las propiedades distancia y tiempo deben ser numeros" })
        }

        distanciaTotal += distancia
        tiempoTotal += tiempo
      }

      return res.status(200).json({ resultado: (distanciaTotal / tiempoTotal).toFixed(2) })
    }
    catch (e) {
      console.log( e.message )
      return res.status(500).json({ error: e.message })
    }
  }
)

app.listen(3000, () => console.log(`Servidor arrancado en servidor 3000`));

