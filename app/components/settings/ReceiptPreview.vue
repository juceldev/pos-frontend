<script setup lang="ts">
import type { CompanySetting, PrinterSetting } from '~/types/settings'
import type { Sale } from '~/types/sale'
import { formatAmount } from '~/utils/format'

interface Props {
  company: CompanySetting | null
  printer: PrinterSetting | null
  sale?: Sale | null
}

const props = defineProps<Props>()

const items = computed(() => {
  if (props.sale?.items) return props.sale.items
  return [
    { id: 1, product: { name: 'Sample Item 1' }, quantity: 1, unit_price: 100, total: 100, is_service: false, serials: null },
    { id: 2, product: { name: 'Sample Item 2' }, quantity: 1, unit_price: 250, total: 250, is_service: false, serials: null }
  ] as any[]
})

const receiptNo = computed(() => props.sale?.sale_number ?? 'SALE-00000001')
const receiptDate = computed(() => {
  if (props.sale?.created_at) return new Date(props.sale.created_at).toLocaleString()
  return new Date().toLocaleString()
})
const cashier = computed(() => props.sale?.user?.name ?? 'Admin')
const customer = computed(() => props.sale?.customer?.name ?? 'Walk-in')

const subtotal = computed(() => props.sale?.subtotal ?? 350)
const tax = computed(() => props.sale?.tax ?? 0)
const discount = computed(() => props.sale?.discount ?? 0)
const total = computed(() => props.sale?.total ?? 350)
const paidAmount = computed(() => props.sale?.paid_amount ?? 400)
const change = computed(() => props.sale?.change ?? 50)
const balanceDue = computed(() => Math.max(0, total.value - paidAmount.value))
const paymentType = computed(() => props.sale?.payment_type?.name ?? 'Cash')

const isBond = computed(() => {
  const size = (props.printer?.sales_paper_size ?? '').toLowerCase()
  return size.includes('bond') || size.includes('5.5') || size.includes('8.5 x 11') || size.includes('8.5 x 13')
})
</script>

<template>
  <!-- Formal bond-paper receipt layout -->
  <div v-if="isBond" class="receipt-bond">

    <!-- Header: logo left, company details right -->
    <div class="receipt-bond__masthead">
      <div class="receipt-bond__masthead-logo">
        <img src="/logo.jpg" alt="Company logo" />
      </div>
      <div class="receipt-bond__masthead-info">
        <div class="receipt-bond__company-name">{{ company?.company_name ?? 'Company Name' }}</div>
        <div v-if="company?.reg_permit_no" class="receipt-bond__company-line">Reg No: {{ company.reg_permit_no }}</div>
        <div v-if="company?.vat_no" class="receipt-bond__company-line">VAT No: {{ company.vat_no }}</div>
        <div v-if="company?.address" class="receipt-bond__company-line">Address: {{ company.address }}</div>
        <div v-if="company?.contact_numbers" class="receipt-bond__company-line">Tel: {{ company.contact_numbers }}</div>
        <div v-if="company?.email" class="receipt-bond__company-line">Email: {{ company.email }}</div>
        <div v-if="company?.branch_name" class="receipt-bond__company-line">Branch: {{ company.branch_name }}</div>
      </div>
      <div class="receipt-bond__masthead-info1">
        <div class="receipt-bond__company-name">{{ printer?.sales_receipt_title ?? 'CASH SALE' }}</div>
        <div v-if="receiptNo" class="receipt-bond__company-line">Sales Order No. : {{ receiptNo }}</div>
        <div v-if="receiptNo" class="receipt-bond__company-line">Date : {{ receiptDate }}</div>
        <div v-if="receiptNo" class="receipt-bond__company-line">Terminal: {{ company?.terminal_id ?? company?.pc_name ?? '' }}</div>
        <div v-if="receiptNo" class="receipt-bond__company-line">Customer: {{ customer }}</div>
        <div v-if="receiptNo" class="receipt-bond__company-line">Cashier: {{ cashier }}</div>
      </div>
    </div>

    <div class="receipt-bond__rule1" />

    <!-- Items table -->
    <table class="receipt-bond__items-table">
      <thead>
        <tr>
          <th class="receipt-bond__col-desc">DESCRIPTION</th>
          <th class="receipt-bond__col-price">PRICE</th>
          <th class="receipt-bond__col-qty">QUANTITY</th>
          <th class="receipt-bond__col-warranty">WARRANTY</th>
          <th class="receipt-bond__col-disc">DISCOUNT</th>
          <th class="receipt-bond__col-amount">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            {{ item.is_service ? item.description : item.product?.name ?? 'Item' }}
            <div v-if="item.serials && (Array.isArray(item.serials) ? item.serials.length : item.serials)" class="receipt-bond__serial">
              SN: {{ Array.isArray(item.serials) ? item.serials.join(', ') : item.serials }}
            </div>
          </td>
          <td class="text-right">{{ formatAmount(item.unit_price ?? 0) }}</td>
          <td class="text-center">{{ Number(item.quantity) }}</td>
          <td class="text-center">{{ item.is_service ? '—' : item.product?.warranty_period || '—' }}</td>
          <td class="text-right">{{ formatAmount(item.discount ?? 0) }}</td>
          <td class="text-right">{{ formatAmount(item.total) }}</td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="6" class="text-center" style="color: #999;">No items</td>
        </tr>
      </tbody>
    </table>

    <!-- Bottom: thank-you left, totals right -->
    <div class="receipt-bond__bottom">
      <div class="receipt-bond__payment">
        <div class="receipt-bond__thank-you">
          {{ printer?.receipt_footer_remark ?? 'We\'ve received your payment, thanks!' }}
        </div>
        <div v-if="printer?.receipt_vat_remark || printer?.receipt_terms" class="receipt-bond__footer">
          <div v-if="printer?.receipt_vat_remark" class="receipt-bond__footer-line">{{ printer.receipt_vat_remark }}</div>
          <div v-if="printer?.receipt_terms" class="receipt-bond__footer-line">{{ printer.receipt_terms }}</div>
        </div>
        <table class="receipt-bond__signatures">
          <tbody>
            <tr>
              <td>AUTHORIZED PERSONNEL:</td>
              <td>RECEIVED BY:</td>
            </tr>
            <tr>
              <td><div class="receipt-bond__sig-line" /></td>
              <td><div class="receipt-bond__sig-line" /></td>
            </tr>
            <tr>
              <td class="receipt-bond__sig-label">STAFF's SIGNATURE</td>
              <td class="receipt-bond__sig-label">CLIENT's SIGNATURE</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table class="receipt-bond__totals-table">
        <tbody>
          <tr>
            <td class="receipt-bond__totals-label">Subtotal :</td>
            <td class="text-right">{{ formatAmount(subtotal) }}</td>
          </tr>
          <tr v-if="discount">
            <td class="receipt-bond__totals-label">Discount :</td>
            <td class="text-right">-{{ formatAmount(discount) }}</td>
          </tr>
          <tr class="receipt-bond__totals-total">
            <td class="receipt-bond__totals-label text-bold">TOTAL :</td>
            <td class="text-right text-bold">{{ formatAmount(total) }}</td>
          </tr>
          <tr class="receipt-bond__totals-paid">
            <td class="receipt-bond__totals-label text-bold">TOTAL PAID  :</td>
            <td class="text-right text-bold">{{ formatAmount(paidAmount) }}</td>
          </tr>
          <tr>
            <td class="receipt-bond__totals-label">Payment method  :</td>
            <td class="text-right">{{ paymentType }}</td>
          </tr>
          <tr v-if="change">
            <td class="receipt-bond__totals-label">Change  :</td>
            <td class="text-right">{{ formatAmount(change) }}</td>
          </tr>
          <tr v-else>
            <td class="receipt-bond__totals-label">BALANCE DUE  :</td>
            <td class="text-right">{{ formatAmount(balanceDue) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Thermal receipt layout (unchanged) -->
  <div v-else class="receipt-thermal">
    <div class="receipt-thermal__edge" />
    <div class="receipt-thermal__body">
      <div v-if="company?.company_logo_url" class="receipt-logo">
        <v-img :src="company.company_logo_url" max-height="70" contain />
      </div>
      <div class="receipt-company text-center">
        <div class="receipt-company__name">{{ company?.company_name ?? 'Company Name' }}</div>
        <div v-if="company?.branch_name" class="receipt-line">{{ company.branch_name }}</div>
        <div v-if="company?.address" class="receipt-line">{{ company.address }}</div>
        <div v-if="company?.contact_numbers" class="receipt-line">{{ company.contact_numbers }}</div>
        <div v-if="company?.email" class="receipt-line">{{ company.email }}</div>
        <div v-if="company?.reg_permit_no" class="receipt-line">Reg/VAT #: {{ company.reg_permit_no }}</div>
      </div>
      <div class="receipt-title text-center">
        {{ printer?.sales_receipt_title ?? 'SALES RECEIPT' }}
      </div>
      <div class="receipt-divider" />
      <div class="receipt-info">
        <div class="receipt-info__row"><span>Receipt No:</span><span>{{ receiptNo }}</span></div>
        <div class="receipt-info__row"><span>Date:</span><span>{{ receiptDate }}</span></div>
        <div class="receipt-info__row"><span>Cashier:</span><span>{{ cashier }}</span></div>
        <div class="receipt-info__row"><span>Customer:</span><span>{{ customer }}</span></div>
      </div>
      <div class="receipt-divider" />
      <div class="receipt-items">
        <div v-for="item in items" :key="item.id" class="receipt-item">
          <div class="receipt-item__name">{{ item.is_service ? item.description : item.product?.name ?? 'Item' }}</div>
          <div class="receipt-item__row">
            <span>{{ Number(item.quantity) }} x {{ formatAmount(item.unit_price ?? 0) }}</span>
            <span>{{ formatAmount(item.total) }}</span>
          </div>
          <div v-if="item.serials && (Array.isArray(item.serials) ? item.serials.length : item.serials)" class="receipt-item__serial">
            SN: {{ Array.isArray(item.serials) ? item.serials.join(', ') : item.serials }}
          </div>
        </div>
      </div>
      <div class="receipt-divider" />
      <div class="receipt-totals">
        <div class="receipt-totals__row"><span>Subtotal</span><span>{{ formatAmount(subtotal) }}</span></div>
        <div v-if="tax" class="receipt-totals__row"><span>VAT</span><span>{{ formatAmount(tax) }}</span></div>
        <div class="receipt-totals__row"><span>Discount</span><span>{{ formatAmount(discount) }}</span></div>
        <div class="receipt-totals__row receipt-totals__row--bold"><span>TOTAL</span><span>{{ formatAmount(total) }}</span></div>
        <div class="receipt-divider" />
        <div class="receipt-totals__row"><span>Payment</span><span>{{ paymentType }}</span></div>
        <div v-if="sale?.payment_reference_no" class="receipt-totals__row"><span>Ref No</span><span>{{ sale.payment_reference_no }}</span></div>
        <div v-if="sale?.payment_approval_code" class="receipt-totals__row"><span>Approval</span><span>{{ sale.payment_approval_code }}</span></div>
        <div class="receipt-totals__row"><span>Paid</span><span>{{ formatAmount(paidAmount) }}</span></div>
        <div class="receipt-totals__row"><span>Change</span><span>{{ formatAmount(change) }}</span></div>
      </div>
      <div class="receipt-divider" />
      <div class="receipt-footer text-center">
        <div class="receipt-footer__remark">{{ printer?.receipt_footer_remark ?? 'Thank You. Come Again!' }}</div>
        <div v-if="printer?.receipt_vat_remark" class="receipt-footer__vat">{{ printer.receipt_vat_remark }}</div>
        <div v-if="printer?.receipt_terms" class="receipt-footer__terms">{{ printer.receipt_terms }}</div>
      </div>
      <table class="receipt-signatures">
        <tbody>
          <tr>
            <td>AUTHORIZED PERSONNEL:</td>
            <td>RECEIVED BY:</td>
          </tr>
          <tr>
            <td><div class="receipt-signatures__line" /></td>
            <td><div class="receipt-signatures__line" /></td>
          </tr>
          <tr>
            <td class="receipt-signatures__label">STAFF's SIGNATURE</td>
            <td class="receipt-signatures__label">CLIENT's SIGNATURE</td>
          </tr>
        </tbody>
      </table>
      <div class="receipt-barcode text-center">
        <div class="receipt-barcode__lines"><span v-for="n in 30" :key="n" :style="{ width: (n % 2 === 0 ? '2px' : '1px') }" /></div>
        <div class="receipt-barcode__text">*{{ receiptNo }}*</div>
      </div>
    </div>
    <div class="receipt-thermal__edge receipt-thermal__edge--bottom" />
  </div>
</template>

<style scoped>
/* === Bond-paper formal receipt === */
.receipt-bond {
  width: 100%;
  /* max-width: 780px; */
  background: #fff;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 11px;
  color: #000;
  padding: 8px 8px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.receipt-bond__masthead {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 10px;
}

.receipt-bond__masthead-logo {
  flex: none;
  width: 110px;
}

.receipt-bond__masthead-logo img {
  width: 100%;
  display: block;
}

.receipt-bond__masthead-info {
  flex: 1;
  padding-top: 4px;
}
.receipt-bond__masthead-info1 {
  flex: 0.5;
  padding-top: 4px;
}

.receipt-bond__company-name {
  font-weight: bold;
  font-size: 17px;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.receipt-bond__company-line {
  font-size: 10.5px;
  line-height: 1.45;
}

.receipt-bond__rule {
  border-top: 1.5px solid #000;
  margin-bottom: 18px;
}
.receipt-bond__rule1 {
  border-top: 1.5px solid #000;
  margin-bottom: 2px;
}

.receipt-bond__doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  position: relative;
}

.receipt-bond__doc-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  font-size: 15px;
  letter-spacing: 1px;
}

.receipt-bond__docinfo {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  margin-bottom: 14px;
}

.receipt-bond__docinfo-col {
  flex: 1;
  max-width: 300px;
}

.receipt-bond__meta-row {
  display: grid;
  grid-template-columns: 100px 12px 1fr;
  font-size: 11px;
  line-height: 1.8;
}

.receipt-bond__info-table {
  border-collapse: collapse;
  font-size: 10px;
  min-width: 220px;
}

.receipt-bond__info-table td {
  border: 1px solid #999;
  padding: 4px 8px;
}

.receipt-bond__info-label {
  font-style: italic;
  background: #f9f9f9;
  min-width: 110px;
  white-space: nowrap;
}

.receipt-bond__items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
}

.receipt-bond__items-table thead th {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
  padding: 6px 8px;
  border-bottom: 2px solid #000;
  text-align: left;
}

.receipt-bond__col-desc { width: 48%; }
.receipt-bond__col-price { width: 12%; }
.receipt-bond__col-qty { width: 10%; }
.receipt-bond__col-warranty { width: 12%; }
.receipt-bond__col-disc { width: 9%; }
.receipt-bond__col-amount { width: 9%; }

.receipt-bond__items-table thead .receipt-bond__col-price,
.receipt-bond__items-table thead .receipt-bond__col-disc,
.receipt-bond__items-table thead .receipt-bond__col-amount {
  text-align: right;
}

.receipt-bond__items-table thead .receipt-bond__col-qty,
.receipt-bond__items-table thead .receipt-bond__col-warranty {
  text-align: center;
}

.receipt-bond__items-table tbody td {
  padding: 5px 8px;
  border-bottom: 1px solid #ddd;
  vertical-align: top;
  font-size: 10.5px;
}

.receipt-bond__serial {
  font-size: 9px;
  color: #666;
  margin-top: 2px;
}

.receipt-bond__bottom {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  align-items: flex-start;
}

.receipt-bond__payment {
  flex: 1;
  min-width: 0;
}

.receipt-bond__thank-you {
  font-size: 11px;
  color: #231f1f;
  margin-bottom: 8px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.receipt-bond__totals-table {
  border-collapse: collapse;
  font-size: 10.5px;
  min-width: 220px;
  flex: none;
}

.receipt-bond__totals-table td {
    border-bottom: 1px solid #161515;
  padding: 4px 10px;
}

.receipt-bond__totals-label {
  /* font-style: italic; */
  background: #f9f9f9;
  width: 129px;
}

.receipt-bond__totals-total td {
  background: #e0e0e0;
  font-weight: bold;
  font-size: 11px;
}

.receipt-bond__totals-paid td {
  /* background: #3f51b5 !important; */
  /* color: white; */
  font-weight: bold;
  font-size: 11px;
}

.text-bold { font-weight: bold; }

.receipt-bond__footer {
  margin-top: 14px;
  padding-top: 5px;
  border-top: 1px solid #ddd;
  text-align: left;
}

.receipt-bond__footer-line {
  font-size: 10.5px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 3px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.receipt-bond__signatures {
  width: 100%;
  margin-top: 26px;
  font-size: 11px;
  text-align: left;
  border-collapse: collapse;
}

.receipt-bond__signatures td { padding: 2px 24px 2px 0; }
.receipt-bond__sig-line { height: 26px; border-bottom: 1px solid #000; }
.receipt-bond__sig-label { font-size: 9px; color: #555; padding-top: 3px; }

/* === Thermal receipt (existing) === */
.receipt-thermal {
  width: 280px;
  background: #fff;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #000;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.receipt-thermal__edge {
  height: 6px;
  background: repeating-linear-gradient(45deg, #fff 0, #fff 4px, #e0e0e0 4px, #e0e0e0 8px);
  border-bottom: 1px solid #d0d0d0;
}

.receipt-thermal__edge--bottom {
  border-bottom: none;
  border-top: 1px solid #d0d0d0;
}

.receipt-thermal__body { padding: 12px 14px; }
.receipt-logo { display: flex; justify-content: center; margin-bottom: 8px; }
.receipt-company__name { font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
.receipt-line { font-size: 10px; color: #333; }
.receipt-title { font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 4px; }
.receipt-divider { border-top: 1px dashed #999; margin: 6px 0; }
.receipt-info__row, .receipt-totals__row { display: flex; justify-content: space-between; margin: 1px 0; }
.receipt-totals__row--bold { font-weight: bold; font-size: 12px; margin-top: 2px; }
.receipt-item { margin-bottom: 4px; }
.receipt-item__name { font-weight: bold; }
.receipt-item__row { display: flex; justify-content: space-between; font-size: 10px; }
.receipt-item__serial { font-size: 9px; color: #1611118c; }
.receipt-footer { margin-top: 6px; }
.receipt-footer__remark { font-weight: bold; font-size: 12px;text-wrap: wrap !important; }
.receipt-footer__vat, .receipt-footer__terms { font-size: 9px; color: #555; margin-top: 2px; }
.receipt-signatures { width: 100%; margin-top: 20px; font-size: 9px; text-align: left; border-collapse: collapse; }
.receipt-signatures td { padding: 1px 12px 1px 0; }
.receipt-signatures__line { height: 24px; border-bottom: 1px solid #000; }
.receipt-signatures__label { font-size: 8px; color: #555; padding-top: 2px; }
.receipt-barcode { margin-top: 8px; }
.receipt-barcode__lines { display: flex; justify-content: center; gap: 1px; height: 30px; }
.receipt-barcode__lines span { display: inline-block; background: #000; height: 100%; }
.receipt-barcode__text { font-size: 10px; letter-spacing: 2px; margin-top: 2px; }
</style>
