# Goodkart – Changes for Task 2 (seller pricing) & Task 3 (invoice audit)

> Your message listed tasks **2** and **3** only. Task 1 was not in the message, so nothing was done for it – send it and I'll handle it.

## Root cause (Task 2)
Seller form fields are: `price` = Base price / **MRP**, `discountPrice` = **selling price**. But
* the labels ("Base Price" / "Discount Price") were ambiguous, so sellers entered them inconsistently;
* every cart/order item stores `price = MRP`; the backend then used `item.price` for **seller revenue, platform fee, payout and invoices** → the seller was shown/charged on the MRP instead of the price the customer actually paid;
* the seller UI computed the platform-fee preview on the MRP, not the selling price.

## What was changed
### Seller pricing (Myntra style: ₹Selling ~~₹MRP~~ (X% OFF))
| File | Change |
|---|---|
| `frontend/.../seller/pages/AddProduct.jsx` | Labels → **Base Price / MRP** and **Selling Price after Discount**; live "₹700 ~~₹1000~~ (30% OFF)" preview; validation (selling < MRP); fee breakdown now on selling price; review summary shows both |
| `frontend/.../seller/components/dashboard/ProductViewModal.jsx` | Same labels + validation on edit; view mode shows selling price big, MRP struck-through, % OFF |
| `frontend/.../seller/components/AddProduct/VariantsEditor.jsx` | Size-price placeholder uses selling price |
| `frontend/.../shared/utils/priceUtils.js` | `discountPrice` of 0/blank is treated as "no discount" (previously could show ₹0 selling price) |
| `backend/.../utils/pricing.js` (**new**) | Single helper: `getItemSellingPrice`, `computeSellerItemEarnings`, etc. – always uses selling price (ex-GST), never MRP |
| `backend/.../seller/controllers/sellerController.js` | Seller dashboard sales use selling price; `addProduct` rejects selling price ≥ MRP |
| `backend/.../admin/controllers/sellerManagementController.js` | Seller revenue uses selling price; also returns `platformFees`, `platformFeeGST`, `netPayout` |
| `frontend/.../admin/components/SellerInvoiceModal.jsx` | Removed hard-coded 10 % / 90 %; uses real fee & payout from backend |

### Invoices (Task 3)
**Seller side** (`backend/.../admin/controllers/pdfController.js`, endpoint `GET /admin/seller/:uid/pdf`) – there is only an admin-generated seller settlement invoice; sellers have no self-serve download.
Issues found → fixed:
1. Revenue/fee/payout computed on MRP → now selling price (ex-GST).
2. Read non-existent field `discountedPrice` (real field is `discountPrice`) → discounts were never shown; product table now shows MRP, selling price, % off.
3. Missing invoice number/date, Goodkart (billed-by) GSTIN/PAN/address, seller PAN & address → added.
4. No tax split of the platform fee → now Taxable value + CGST 9 % + SGST 9 % (SAC 998314).
5. Cancelled/returned lines were counted → excluded.
6. Order ID truncated ("OD17…") → full ID; totals row added; unit price column added; date filter no longer includes orders with no date.
7. Bank account number printed in full → masked (XXXX1234).
8. Analytics PDF used the same wrong price → fixed with same helper.

**Customer side** – exists: `/invoice?orderId=` (`Invoice.jsx`, browser PDF) and backend PDF (`invoiceService.js`, emailed at order time). Issues → fixed:
1. Fallback used `item.price` (MRP) for older orders → now selling price.
2. Invoice date was "today" at generation → order date.
3. Platform fee used hard-coded 3.5 % → uses the order's saved fee (`effectivePlatformFee` / breakdown).
4. INTRA hard-coded → INTRA/INTER by buyer state.
5. Company details duplicated → shared `backend/src/config/company.js`.

## Steps for you
1. `cd backend && npm i && npm start`; `cd frontend && npm i && npm run dev`.
2. Add a product: Base Price 1000, Selling Price 700 → check preview "₹700 ~~₹1000~~ (30% OFF)", fee preview is on ₹700; try Selling ≥ MRP → blocked.
3. Place an order, mark Delivered, open Admin → Sellers → Invoice → Download PDF; revenue should be 700×qty (ex-GST), not 1000×qty.
4. Open the customer invoice for that order and compare totals with the amount paid.

## Still to review (not changed / needs your input)
* **Not run here** (no network/node_modules): I syntax-checked all edited files and unit-tested the pricing helper only; please run the app and PDF once.
* Company GSTIN/PAN/address, "Shipped from" address (`Kotur Dharwad`) and SAC 996511 on the customer invoice are placeholders/hard-coded – put real values.
* Orders store client-sent totals (`amount`, prices) – the backend does not recompute price server-side; recommended hardening.
* Sellers have no invoice download in their own dashboard – say if you want it added.
* `.env` files are inside the zip – rotate any real keys.
