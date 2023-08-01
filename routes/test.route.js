import express from 'express';
import asyncHandler from 'express-async-handler';
import schedule, { Job } from 'node-schedule';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { sendMail } from '../utils/nodemailler.js';
import { multerUpload } from '../utils/multer.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import Variant from '../models/variant.model.js';

/* dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
}); 

const multerUpload = multer({}); */

//cloudinary = cloudinary.v2;
//const upload = multer();

const testRouter = express.Router();

testRouter.post(
    '/send-mail',
    asyncHandler(async (req, res, next) => {
        const messageOptions = {
            recipient: 'nthai2001cr@gmail.com',
            subject: 'test lần thứ n',
        };
        try {
            await sendMail(messageOptions);
            res.status(200);
            res.json('Sending mail successfully');
        } catch (error) {
            next(error);
        }
    }),
);

testRouter.get('/cron-job', (req, res) => {
    const expiredTime = 2;
    let now = Date.now().toString();
    const scheduledJob = schedule.scheduleJob(now, `*/${expiredTime} * * * * *`, () => {
        console.log(Date.now());
        let number = Math.floor(Math.random() * (10 - 0) + 0);
        console.log(`Number: ${number}`);
        if (number % 2 == 0) {
            scheduledJob.cancel();
            console.log('Job stopped');
        }
    });
    res.status(200);
    res.json('Job started');
});

testRouter.get('/verify-email/', (req, res) => {
    res.status(200);
    res.json('Here you go');
});

testRouter.get('/', (req, res) => {
    res.status(200);
    res.json('Test router');
});

testRouter.get(
    '/exception',
    asyncHandler(async (req, res) => {
        someFunction();
    }),
);

//Create new cart - Not use
testRouter.post(
    '/create-cart',
    asyncHandler(async (req, res) => {
        const newCart = await Cart.create({
            user: req.body.userId,
            cartItems: [],
        });
        res.status(200);
        res.json(newCart);
    }),
);

testRouter.post(
    '/upload',
    multerUpload.single('image'),
    asyncHandler(async (req, res) => {
        console.log(req.body.name);
        if (!req.file) {
            throw new Error('No file provided');
        }
        const image = await cloudinaryUpload(req.file.path);
        if (!image) {
            res.status(500);
            throw new Error('Error while uploading image');
        }
        fs.unlink(req.file.path, (error) => {
            if (error) {
                throw new Error(error);
            }
            res.status(200);
            res.json(req.file);
        });
    }),
);

testRouter.delete(
    '/image/:id',
    asyncHandler(async (req, res) => {
        const publicId = req.params.id;
        const result = await cloudinaryRemove(publicId);
        res.json({ message: result });
    }),
);

testRouter.get(
    '/populated/:_id',
    asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params._id).populate('variants');
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }
        res.status(200);
        res.json(product);
    }),
);

const someFunction = function () {
    throw new Error('Check this error');
};

testRouter.get('/test-findLastIndex', (req, res) => {
    const arr = [1, 2, 3];
    console.log(arr.findLastIndex((element) => element == 3));
});

testRouter.get(
    '/document/:id',
    asyncHandler(async (req, res) => {
        const variant = await Variant.findOne({ product: req.params.id });
        if (!variant) {
            res.status(400);
            throw new Error('Variant not found');
        }
        res.status(200);
        res.json(variant);
    }),
);

testRouter.post(
    '/upload/multi',
    multerUpload.array('image', 10),
    asyncHandler(async (req, res) => {
        console.log(req.body.name);
        if (!req.files) {
            throw new Error('No file provided');
        }
        const images = [];
        const multiUpload = req.files.map(async (file) => {
            const image = await cloudinaryUpload(file.path);
            images.push(image);
            if (!image) {
                res.status(500);
                throw new Error('Error while uploading image');
            }
            fs.unlink(file.path, (error) => {
                if (error) {
                    throw new Error(error);
                }
            });
        });
        await Promise.all(multiUpload);
        res.status(200);
        res.json(images);
    }),
);

export default testRouter;
