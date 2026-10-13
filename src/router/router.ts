import { Router } from "express";
import { AuthController } from "../controllers/auth/auth.controller";
import { ProductsController } from "../controllers/products/products.controller";
import { BasketController } from "../controllers/basket/basket.controller";
import { authMiddleware } from "../middleware/auth";
import { VisualisationsController } from "../controllers/visualisations/visualisations.controller";
import { optionalAuthMiddleware } from "../middleware/optionalAuth";

const router = Router();


router.get("/basket", authMiddleware, BasketController.getBasket);
router.post("/basket/add", authMiddleware, BasketController.add);
router.patch("/basket/update", authMiddleware, BasketController.update);
router.delete("/basket/remove/:productId", authMiddleware, BasketController.remove);
router.delete("/basket/clear", authMiddleware, BasketController.clear);

router.get("/products", ProductsController.getProducts);


router.post("/auth/sendCode", AuthController.sendCode);
router.post("/auth/verify-code", AuthController.verifyCode);
router.post("/auth/logout", AuthController.logout);

router.post("/visualisations", authMiddleware, VisualisationsController.create);
router.get("/visualisations/history", authMiddleware, VisualisationsController.listHistory);
router.get("/visualisations/public", VisualisationsController.listPublic);
router.get("/visualisations/:visId", optionalAuthMiddleware, VisualisationsController.getOne);
router.delete("/visualisations/:visId", authMiddleware, VisualisationsController.delete);
router.patch("/visualisations/:visId/visibility", authMiddleware, VisualisationsController.setVisibility);
router.post("/visualisations/:visId/like", authMiddleware, VisualisationsController.toggleLike);

export = router;
