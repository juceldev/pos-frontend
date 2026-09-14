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

const isPreview = computed(() => !props.sale)

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
const paymentType = computed(() => props.sale?.payment_type?.name ?? 'Cash')

const isBond = computed(() => {
  const size = (props.printer?.sales_paper_size ?? '').toLowerCase()
  return size.includes('bond') || size.includes('5.5') || size.includes('8.5 x 11') || size.includes('8.5 x 13')
})
</script>

<template>
  <div :class="['receipt-thermal', { 'receipt-thermal--bond': isBond }]">
    <!-- Paper edge effect -->
    <div class="receipt-thermal__edge" />

    <div class="receipt-thermal__body">
      <!-- Logo -->
      <div v-if="company?.company_logo_url" class="receipt-logo">
        <v-img :src="company.company_logo_url" max-height="70" contain />
      </div>

      <!-- Company header -->
      <div class="receipt-company text-center">
        <div class="receipt-company__name">{{ company?.company_name ?? 'Company Name' }}</div>
        <div v-if="company?.branch_name" class="receipt-line">{{ company.branch_name }}</div>
        <div v-if="company?.address" class="receipt-line">{{ company.address }}</div>
        <div v-if="company?.contact_numbers" class="receipt-line">{{ company.contact_numbers }}</div>
        <div v-if="company?.email" class="receipt-line">{{ company.email }}</div>
        <div v-if="company?.reg_permit_no" class="receipt-line">Reg/VAT #: {{ company.reg_permit_no }}</div>
      </div>

      <!-- Receipt title -->
      <div class="receipt-title text-center">
        {{ printer?.sales_receipt_title ?? 'SALES RECEIPT' }}
      </div>

      <div class="receipt-divider" />

      <!-- Transaction info -->
      <div class="receipt-info">
        <div class="receipt-info__row">
          <span>Receipt No:</span>
          <span>{{ receiptNo }}</span>
        </div>
        <div class="receipt-info__row">
          <span>Date:</span>
          <span>{{ receiptDate }}</span>
        </div>
        <div class="receipt-info__row">
          <span>Cashier:</span>
          <span>{{ cashier }}</span>
        </div>
        <div class="receipt-info__row">
          <span>Customer:</span>
          <span>{{ customer }}</span>
        </div>
      </div>

      <div class="receipt-divider" />

      <!-- Items -->
      <div class="receipt-items">
        <div v-for="item in items" :key="item.id" class="receipt-item">
          <div class="receipt-item__name">
            {{ item.is_service ? item.description : item.product?.name ?? 'Item' }}
          </div>
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

      <!-- Totals -->
      <div class="receipt-totals">
        <div class="receipt-totals__row">
          <span>Subtotal</span>
          <span>{{ formatAmount(subtotal) }}</span>
        </div>
        <div v-if="tax" class="receipt-totals__row">
          <span>VAT</span>
          <span>{{ formatAmount(tax) }}</span>
        </div>
        <div class="receipt-totals__row">
          <span>Discount</span>
          <span>{{ formatAmount(discount) }}</span>
        </div>
        <div class="receipt-totals__row receipt-totals__row--bold">
          <span>TOTAL</span>
          <span>{{ formatAmount(total) }}</span>
        </div>
        <div class="receipt-divider" />
        <div class="receipt-totals__row">
          <span>Payment</span>
          <span>{{ paymentType }}</span>
        </div>
        <div v-if="sale?.payment_reference_no" class="receipt-totals__row">
          <span>Ref No</span>
          <span>{{ sale.payment_reference_no }}</span>
        </div>
        <div v-if="sale?.payment_approval_code" class="receipt-totals__row">
          <span>Approval</span>
          <span>{{ sale.payment_approval_code }}</span>
        </div>
        <div class="receipt-totals__row">
          <span>Paid</span>
          <span>{{ formatAmount(paidAmount) }}</span>
        </div>
        <div class="receipt-totals__row">
          <span>Change</span>
          <span>{{ formatAmount(change) }}</span>
        </div>
      </div>

      <div class="receipt-divider" />

      <!-- Footer -->
      <div class="receipt-footer text-center">
        <div class="receipt-footer__remark">
          {{ printer?.receipt_footer_remark ?? 'Thank You. Come Again!' }}
        </div>
        <div v-if="printer?.receipt_vat_remark" class="receipt-footer__vat">
          {{ printer.receipt_vat_remark }}
        </div>
        <div v-if="printer?.receipt_terms" class="receipt-footer__terms">
          {{ printer.receipt_terms }}
        </div>
      </div>

      <!-- Barcode -->
      <div class="receipt-barcode text-center">
        <div class="receipt-barcode__lines">
          <span v-for="n in 30" :key="n" :style="{ width: (n % 2 === 0 ? '2px' : '1px') }" />
        </div>
        <div class="receipt-barcode__text">*{{ receiptNo }}*</div>
      </div>
    </div>

    <!-- Paper bottom edge -->
    <div class="receipt-thermal__edge receipt-thermal__edge--bottom" />
  </div>
</template>

<style scoped>
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
  background: repeating-linear-gradient(
    45deg,
    #fff 0,
    #fff 4px,
    #e0e0e0 4px,
    #e0e0e0 8px
  );
  border-bottom: 1px solid #d0d0d0;
}

.receipt-thermal__edge--bottom {
  border-bottom: none;
  border-top: 1px solid #d0d0d0;
}

.receipt-thermal__body {
  padding: 12px 14px;
}

.receipt-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.receipt-company__name {
  font-weight: bold;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.receipt-line {
  font-size: 10px;
  color: #333;
}

.receipt-title {
  font-weight: bold;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 8px 0 4px;
}

.receipt-divider {
  border-top: 1px dashed #999;
  margin: 6px 0;
}

.receipt-info__row,
.receipt-totals__row {
  display: flex;
  justify-content: space-between;
  margin: 1px 0;
}

.receipt-totals__row--bold {
  font-weight: bold;
  font-size: 12px;
  margin-top: 2px;
}

.receipt-item {
  margin-bottom: 4px;
}

.receipt-item__name {
  font-weight: bold;
}

.receipt-item__row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.receipt-item__serial {
  font-size: 9px;
  color: #555;
}

.receipt-footer {
  margin-top: 6px;
}

.receipt-footer__remark {
  font-weight: bold;
  font-size: 12px;
}

.receipt-footer__vat,
.receipt-footer__terms {
  font-size: 9px;
  color: #555;
  margin-top: 2px;
}

.receipt-barcode {
  margin-top: 8px;
}

.receipt-barcode__lines {
  display: flex;
  justify-content: center;
  gap: 1px;
  height: 30px;
}

.receipt-barcode__lines span {
  display: inline-block;
  background: #000;
  height: 100%;
}

.receipt-barcode__text {
  font-size: 10px;
  letter-spacing: 2px;
  margin-top: 2px;
}

.receipt-thermal--bond {
  width: 5.5in;
  min-height: 8.5in;
  padding: 0.5in;
  border: 1px solid #000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.receipt-thermal--bond .receipt-thermal__body {
  width: 100%;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.receipt-thermal--bond .receipt-company__name {
  font-size: 16px;
}

.receipt-thermal--bond .receipt-title {
  font-size: 14px;
}

.receipt-thermal--bond .receipt-item__row,
.receipt-thermal--bond .receipt-totals__row {
  font-size: 12px;
}

.receipt-thermal--bond .receipt-footer__remark {
  font-size: 14px;
}

.receipt-thermal--bond .receipt-barcode {
  margin-bottom: 0.25in;
}
</style>
