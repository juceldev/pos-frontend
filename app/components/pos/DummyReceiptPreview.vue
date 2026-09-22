<script setup lang="ts">
import type { CompanySetting, PrinterSetting } from '~/types/settings'
import type { CartItem } from '~/types/cart'
import { useAuthStore } from '~/stores/auth'

interface Props {
  company: CompanySetting | null
  printer: PrinterSetting | null
  cart: CartItem[]
  orderNumber?: string
}

const props = defineProps<Props>()

const auth = useAuthStore()

const totalAmount = ref('')

function onTotalEdit (e: Event) {
  totalAmount.value = (e.target as HTMLElement).innerText
}

const items = computed(() => props.cart ?? [])

const transactionNo = computed(() => props.orderNumber || `DUMMY-${String(Date.now()).slice(-8)}`)
const receiptDate = new Date().toLocaleString()
const cashier = computed(() => auth.user?.name ?? 'Cashier')

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
        <div class="receipt-bond__company-name">WARRANTY RECEIPT</div>
        <div class="receipt-bond__company-line">Transaction No. : {{ transactionNo }}</div>
        <div class="receipt-bond__company-line">Date : {{ receiptDate }}</div>
        <div class="receipt-bond__company-line">Terminal: {{ company?.terminal_id ?? company?.pc_name ?? '' }}</div>
        <div class="receipt-bond__company-line">Cashier: {{ cashier }}</div>
      </div>
    </div>

    <div class="receipt-bond__rule1" />

    <!-- Items table: description + warranty only -->
    <table class="receipt-bond__items-table">
      <thead>
        <tr>
          <th class="receipt-bond__col-desc">DESCRIPTION</th>
          <th class="receipt-bond__col-warranty">WARRANTY</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td>
            {{ item.is_service ? item.description : item.product?.name ?? 'Item' }}
            <div v-if="item.serials?.length" class="receipt-bond__serial">
              SN: {{ item.serials.join(', ') }}
            </div>
          </td>
          <td class="text-center">{{ item.is_service ? '—' : item.product?.warranty_period || '—' }}</td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="2" class="text-center" style="color: #999;">No items in cart</td>
        </tr>
      </tbody>
    </table>

    <!-- Bottom: thank-you left, signatures right -->
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
            <td class="text-right">
              <div class="dummy-editable dummy-editable--right" contenteditable="true" />
            </td>
          </tr>
          <tr>
            <td class="receipt-bond__totals-label">Discount :</td>
            <td class="text-right">
              <div class="dummy-editable dummy-editable--right" contenteditable="true" />
            </td>
          </tr>
          <tr class="receipt-bond__totals-total">
            <td class="receipt-bond__totals-label text-bold">TOTAL :</td>
            <td class="text-right">
              <div
                class="dummy-editable dummy-editable--right text-bold"
                contenteditable="true"
                @input="onTotalEdit"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Thermal receipt layout -->
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
      <div class="receipt-title text-center">WARRANTY RECEIPT</div>
      <div class="receipt-divider" />
      <div class="receipt-info">
        <div class="receipt-info__row"><span>Transaction No:</span><span>{{ transactionNo }}</span></div>
        <div class="receipt-info__row"><span>Date:</span><span>{{ receiptDate }}</span></div>
        <div class="receipt-info__row"><span>Cashier:</span><span>{{ cashier }}</span></div>
      </div>
      <div class="receipt-divider" />
      <div class="receipt-items">
        <div v-for="(item, index) in items" :key="index" class="receipt-item">
          <div class="receipt-item__name">{{ item.is_service ? item.description : item.product?.name ?? 'Item' }}</div>
          <div v-if="item.serials?.length" class="receipt-item__serial">
            SN: {{ item.serials.join(', ') }}
          </div>
          <div class="receipt-item__row">
            <span>Warranty:</span>
            <span>{{ item.is_service ? '—' : item.product?.warranty_period || '—' }}</span>
          </div>
        </div>
        <div v-if="!items.length" class="receipt-item" style="color: #999;">No items in cart</div>
      </div>
      <div class="receipt-divider" />
      <div class="receipt-totals">
        <div class="receipt-totals__row receipt-totals__row--bold">
          <span>TOTAL</span>
          <span
            class="dummy-editable dummy-editable--right"
            contenteditable="true"
            @input="onTotalEdit"
          />
        </div>
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
        <div class="receipt-barcode__text">*{{ transactionNo }}*</div>
      </div>
    </div>
    <div class="receipt-thermal__edge receipt-thermal__edge--bottom" />
  </div>
</template>

<style scoped>
/* === Bond-paper formal receipt === */
.receipt-bond {
  width: 100%;
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

.receipt-bond__rule1 {
  border-top: 1.5px solid #000;
  margin-bottom: 2px;
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

.receipt-bond__col-desc { width: 70%; }
.receipt-bond__col-warranty { width: 30%; text-align: center; }

.receipt-bond__items-table thead .receipt-bond__col-warranty {
  text-align: center;
}

.receipt-bond__items-table tbody td,
.receipt-bond__items-table tfoot td {
  padding: 5px 8px;
  border-bottom: 1px solid #ddd;
  vertical-align: top;
  font-size: 10.5px;
}

.receipt-bond__items-table tfoot td {
  border-top: 2px solid #000;
  border-bottom: none;
  font-size: 11px;
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
  background: #f9f9f9;
  width: 129px;
}

.receipt-bond__totals-total td {
  background: #e0e0e0;
  font-weight: bold;
  font-size: 11px;
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

/* === Thermal receipt === */
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
.receipt-footer__remark { font-weight: bold; font-size: 12px; text-wrap: wrap !important; }
.receipt-footer__vat, .receipt-footer__terms { font-size: 9px; color: #555; margin-top: 2px; }
.receipt-signatures { width: 100%; margin-top: 20px; font-size: 9px; text-align: left; border-collapse: collapse; }
.receipt-signatures td { padding: 1px 12px 1px 0; }
.receipt-signatures__line { height: 24px; border-bottom: 1px solid #000; }
.receipt-signatures__label { font-size: 8px; color: #555; padding-top: 2px; }
.receipt-barcode { margin-top: 8px; }
.receipt-barcode__lines { display: flex; justify-content: center; gap: 1px; height: 30px; }
.receipt-barcode__lines span { display: inline-block; background: #000; height: 100%; }
.receipt-barcode__text { font-size: 10px; letter-spacing: 2px; margin-top: 2px; }

/* === Editable total === */
.dummy-editable {
  min-width: 60px;
  min-height: 16px;
  padding: 1px 4px;
  border-bottom: 1px dashed #bbb;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.dummy-editable:focus { border-bottom-color: #3f51b5; background: #f5f7ff; }
.dummy-editable--center { text-align: center; }
.dummy-editable--right { text-align: right; }
</style>
