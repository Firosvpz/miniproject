const express = require('express')
const adminController = require('../controller/adminController')
const auth = require('../middleware/adminauth')
const couponController = require('../controller/couponController')
const offerController = require('../controller/offerController')
const bannerController = require('../controller/bannerController')
const adminRouter = express()
const uploadImg = require('../middleware/uploadImages')
const path = require('path')
const multer = require('multer')


//................................................................................................................................//
// upload image
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, "..", "public", "webimages"))
    },
    filename: (req, file, callback) => {
        const name = Date.now() + '-' + file.originalname;
        callback(null, name)
    }
})

const upload = multer({ storage: storage }).array('images', 4)
//................................................................................................................................//

// view engine
adminRouter.set('view engine', 'ejs')
adminRouter.set('views', './views/admin')
adminRouter.use(express.json())
adminRouter.use(express.urlencoded({ extended: true }))
//................................................................................................................................//


adminRouter.get('/', adminController.adminLogin)

adminRouter.post('/', adminController.verifyAdminLogin)

adminRouter.get('/dashboard', auth.isAdminLogin, adminController.loadDashboard)

adminRouter.get('/users', auth.isAdminLogin, adminController.usersList)

adminRouter.get('/adminlogout', auth.isAdminLogin, adminController.adminLogout)

adminRouter.post('/users/block/:id', adminController.blockUser)

adminRouter.post('/users/unblock/:id', adminController.unBlockUser)

adminRouter.get('/categories', auth.isAdminLogin, adminController.loadCategory)

adminRouter.post('/categories/list/:id', adminController.listCategory)

adminRouter.post('/categories/unlist/:id', adminController.unListCategory)

adminRouter.get('/addcategory', auth.isAdminLogin, adminController.addCategory)

adminRouter.post('/addcategory', adminController.addCategoryItems)

adminRouter.get('/editcategory', auth.isAdminLogin, adminController.loadEditCategory)

adminRouter.post('/editcategory', adminController.editCategory)

adminRouter.post("/categories/deletecategory/:categoryId", adminController.deleteCategory);

adminRouter.get('/products', auth.isAdminLogin, adminController.loadProducts)

adminRouter.get('/addproducts', auth.isAdminLogin, adminController.loadAddProducts)

adminRouter.post('/addproducts', upload, adminController.addProducts)

adminRouter.post('/products/list/:id', adminController.listProducts)

adminRouter.post('/products/unlist/:id', adminController.unListProducts)

adminRouter.get('/editproducts', auth.isAdminLogin, adminController.loadEditProducts)

adminRouter.post('/editproducts', upload, adminController.editProduct)

adminRouter.put('/products/deleteimg', adminController.deleteImg)

adminRouter.get('/orders', auth.isAdminLogin, adminController.loadOrders)

adminRouter.get('/view', auth.isAdminLogin, adminController.viewOrderPage)

adminRouter.post("/update-order-status", adminController.updateOrderStatus);

adminRouter.get("/coupons", auth.isAdminLogin, couponController.loadCouponList);

adminRouter.get("/addCoupons", auth.isAdminLogin, couponController.loadAddCoupons);

adminRouter.post("/addCoupons", couponController.addCoupon);

adminRouter.get("/edit-coupon", auth.isAdminLogin, couponController.loadEditCoupon)

adminRouter.post("/edit-coupon", couponController.EditCoupon)

adminRouter.post("/coupons/deleteCoupon/:couponId",couponController.deleteCoupons);

adminRouter.get('/offers', auth.isAdminLogin, offerController.loadOffers)

adminRouter.get('/add-offer', auth.isAdminLogin, offerController.loadAddOffer)

adminRouter.post('/add-offer', offerController.addOffer)

adminRouter.patch('/applycategoryOffer', offerController.applycategoryOffer)

adminRouter.patch('/removecategoryOffer', offerController.removeCategoryOffer)

adminRouter.patch('/applyProductOffer', offerController.applyProductOffer)

adminRouter.patch('/removeProductOffer', offerController.removeProductOffer)

adminRouter.post("/offer/deleteOffer/:offerId", offerController.deleteOffer);

adminRouter.get('/sales-report', auth.isAdminLogin, adminController.salesReport)

adminRouter.post('/sales-report', adminController.datePicker)

adminRouter.get('/banner', auth.isAdminLogin, bannerController.loadBanner)

adminRouter.get('/add-banner', bannerController.addBanner)

adminRouter.post('/add-banner', uploadImg.upload.array("bannerImage", 1), bannerController.postBanner)

adminRouter.get('/edit-banner', auth.isAdminLogin, bannerController.loadEditBanner)

adminRouter.post('/edit-banner', uploadImg.upload.array("bannerImage", 1), bannerController.editBanner)


module.exports = adminRouter    