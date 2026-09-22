<script setup lang="ts">
import { watch, nextTick } from 'vue'
import { formatAmount } from '~/utils/format'
import type { Product, ProductFormData } from '~/types/product'
import { useCategories } from '~/composables/useCategories'
import { useProducts } from '~/composables/useProducts'
import { useSuppliers } from '~/composables/useSuppliers'
import { useUnits } from '~/composables/useUnits'
import { useBrands } from '~/composables/useBrands'

const props = defineProps<{
  modelValue: boolean
  product: Product | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: ProductFormData): void
  (e: 'delete', product: Product | null): void
}>()

const { categories, fetchCategories, createCategory } = useCategories()
const { suppliers, fetchSuppliers } = useSuppliers()
const { units, fetchUnits, createUnit } = useUnits()
const { brands, fetchBrands, createBrand } = useBrands()
const { duplicateResults, checkDuplicate, fetchNextSequence, products: allProducts, fetchProducts } = useProducts()
const { printBarcodes } = useBarcodePrint()
const { $api } = useNuxtApp()

const showSerialsDialog = ref(false)
const serials = ref<any[]>([])
const serialsLoading = ref(false)

async function openSerials () {
  if (!props.product) return
  showSerialsDialog.value = true
  serialsLoading.value = true
  try {
    const response = await $api(`/api/products/${props.product.id}/serials`) as any
    serials.value = response?.data ?? response ?? []
  } catch {
    serials.value = []
  } finally {
    serialsLoading.value = false
  }
}

function printBarcode () {
  printBarcodes([{ name: form.name, barcode: form.barcode, price: form.regular_price }])
}

const typeItems = [
  { title: 'No Serial', value: 'no_serial' },
  { title: 'With Serial', value: 'with_serial' }
]

const categoryItems = computed(() => categories.value ?? [])
const supplierItems = computed(() => suppliers.value ?? [])
const unitItems = computed(() => units.value ?? [])
const brandItems = computed(() => brands.value ?? [])
const subCategoryItems = computed(() => subCategories.value ?? [])
const duplicateList = computed(() => duplicateResults.value ?? [])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.product)

const form = reactive<ProductFormData>({
  product_sequence: '',
  barcode: '',
  special_code: '',
  name: '',
  description: '',
  brand: '',
  brand_id: null,
  product_type: 'no_serial',
  category_id: null,
  sub_category_id: null,
  supplier_id: null,
  unit_id: null,
  seller: '',
  cost_price: 0,
  regular_price: 0,
  wholesale_price: 0,
  markup_percent: 0,
  markup_amount: 0,
  wholesale_markup_percent: 0,
  wholesale_markup_amount: 0,
  promo_markup_percent: 0,
  promo_price: 0,
  reorder_level: 0,
  warranty_period: '',
  stock_quantity: 0,
  is_active: true
})

const subCategories = computed(() => {
  if (!form.category_id) return []
  const parent = categories.value.find(c => c.id === form.category_id)
  return parent?.children ?? []
})

watch(() => form.category_id, () => {
  if (form.sub_category_id && !subCategories.value.some(s => s.id === form.sub_category_id)) {
    form.sub_category_id = null
  }
})

function resetForm () {
  lastEditedPriceField = null
  form.product_sequence = ''
  form.barcode = ''
  form.special_code = ''
  form.name = ''
  form.description = ''
  form.brand = ''
  form.brand_id = null
  form.product_type = 'no_serial'
  form.category_id = null
  form.sub_category_id = null
  form.supplier_id = null
  form.unit_id = null
  form.seller = ''
  form.cost_price = 0
  form.regular_price = 0
  form.wholesale_price = 0
  form.markup_percent = 0
  form.markup_amount = 0
  form.wholesale_markup_percent = 0
  form.wholesale_markup_amount = 0
  form.promo_markup_percent = 0
  form.promo_price = 0
  form.reorder_level = 0
  form.warranty_period = ''
  form.has_expiry = false
  form.expiry_date = null
  form.stock_quantity = 0
  form.is_active = true
  form.package_items = []
}

let loadingProduct = false
let lastEditedPriceField: 'markup' | 'price' | null = null

function loadProduct (product: Product | null) {
  loadingProduct = true
  lastEditedPriceField = null
  if (!product) {
    resetForm()
    nextTick(() => { loadingProduct = false })
    return
  }
  form.product_sequence = product.product_sequence
  form.barcode = product.barcode
  form.special_code = product.special_code ?? ''
  form.name = product.name
  form.description = product.description ?? ''
  form.brand = product.brand ?? ''
  form.brand_id = product.brand_data?.id ?? product.brand_id ?? null
  form.product_type = ['no_serial', 'with_serial'].includes(product.product_type) ? product.product_type : 'no_serial'
  form.category_id = product.category?.id ?? null
  form.sub_category_id = product.sub_category?.id ?? null
  form.supplier_id = product.supplier?.id ?? null
  form.unit_id = product.unit?.id ?? null
  if (product.unit && !units.value.some(u => u.id === product.unit!.id)) {
    units.value = [...units.value, product.unit]
  }
  form.seller = product.seller ?? ''
  form.cost_price = Number(product.cost_price)
  form.regular_price = Number(product.regular_price)
  form.wholesale_price = Number(product.wholesale_price)
  form.markup_percent = Number(product.markup_percent)
  form.markup_amount = Number(product.markup_amount)
  form.wholesale_markup_percent = Number(product.wholesale_markup_percent ?? 0)
  form.wholesale_markup_amount = Number(product.wholesale_markup_amount ?? 0)
  form.promo_markup_percent = Number(product.promo_markup_percent ?? 0)
  form.promo_price = Number(product.promo_price ?? 0)
  form.reorder_level = Number(product.reorder_level)
  form.warranty_period = product.warranty_period ?? ''
  form.has_expiry = product.has_expiry ?? false
  form.expiry_date = product.expiry_date ?? null
  form.package_items = (product.package_items ?? []).map(i => ({ product_id: i.product_id, quantity: i.quantity }))
  form.stock_quantity = Number(product.stock_quantity)
  form.is_active = product.is_active
  nextTick(() => { loadingProduct = false })
}

watch(() => props.product, loadProduct, { immediate: true })

watch(() => props.modelValue, async (open) => {
  if (open) {
    await Promise.all([fetchCategories(), fetchSuppliers(), fetchUnits(), fetchBrands(), fetchProducts({ perPage: 200 })])
    loadProduct(props.product)
    if (!isEdit.value) {
      const seq = await fetchNextSequence()
      if (seq) {
        form.product_sequence = seq
      }
    }
  }
})

let updatingFromRegularPrice = false
let updatingFromWholesalePrice = false
let updatingFromPromoPrice = false

// last-edited field wins: markup stays fixed after blur (cost edits recompute
// the price); a typed/loaded price stays fixed and re-derives markup instead
function calculatePrices () {
  if (loadingProduct) return
  const cost = Number(form.cost_price) || 0
  const regular = Number(form.regular_price) || 0
  const markupPercent = Number(form.markup_percent) || 0

  if (markupPercent > 0 && lastEditedPriceField === 'markup' && cost > 0) {
    updatingFromRegularPrice = true
    form.regular_price = Math.round(cost * (1 + markupPercent / 100))
    form.markup_amount = Number((form.regular_price - cost).toFixed(2))
    nextTick(() => { updatingFromRegularPrice = false })
    return
  }

  if (cost > 0 && regular > 0) {
    updatingFromRegularPrice = true
    form.markup_amount = Number((regular - cost).toFixed(2))
    form.markup_percent = Number((((regular - cost) / cost) * 100).toFixed(2))
    nextTick(() => { updatingFromRegularPrice = false })
    return
  }

  if (markupPercent > 0 && cost > 0 && !regular) {
    updatingFromRegularPrice = true
    form.regular_price = Math.round(cost * (1 + markupPercent / 100))
    form.markup_amount = Number((form.regular_price - cost).toFixed(2))
    nextTick(() => { updatingFromRegularPrice = false })
  } else {
    form.markup_amount = markupPercent > 0 ? Number((cost * (markupPercent / 100)).toFixed(2)) : 0
  }

  if (!form.wholesale_price) {
    form.wholesale_price = form.regular_price
  }
}

watch(() => form.cost_price, calculatePrices, { deep: true })

// markup% applies on blur, not per keystroke — and only when it differs
// from what the price implies, so tabbing through never overwrites a manual price
function onMarkupBlur () {
  if (loadingProduct) return
  const cost = Number(form.cost_price) || 0
  const price = Number(form.regular_price) || 0
  const markupPercent = Number(form.markup_percent) || 0
  if (cost <= 0) return
  if (markupPercent <= 0) {
    form.markup_amount = 0
    return
  }
  const impliedMarkup = price > 0 ? Number((((price - cost) / cost) * 100).toFixed(2)) : null
  if (impliedMarkup === markupPercent) return
  lastEditedPriceField = 'markup'
  updatingFromRegularPrice = true
  form.regular_price = Math.round(cost * (1 + markupPercent / 100))
  form.markup_amount = Number((form.regular_price - cost).toFixed(2))
  nextTick(() => { updatingFromRegularPrice = false })
}

watch(() => form.regular_price, () => {
  if (loadingProduct || updatingFromRegularPrice) return
  const cost = Number(form.cost_price) || 0
  const price = Number(form.regular_price) || 0
  if (cost > 0 && price > 0) {
    lastEditedPriceField = 'price'
    updatingFromRegularPrice = true
    form.markup_percent = Number((((price - cost) / cost) * 100).toFixed(2))
    form.markup_amount = Number((price - cost).toFixed(2))
    nextTick(() => { updatingFromRegularPrice = false })
  }
}, { deep: true })

watch(() => [form.wholesale_price, form.cost_price], () => {
  if (loadingProduct) return
  const cost = Number(form.cost_price) || 0
  const price = Number(form.wholesale_price) || 0
  if (cost > 0 && price > 0) {
    updatingFromWholesalePrice = true
    form.wholesale_markup_percent = Number((((price - cost) / cost) * 100).toFixed(2))
    form.wholesale_markup_amount = Number((price - cost).toFixed(2))
    nextTick(() => { updatingFromWholesalePrice = false })
  }
}, { deep: true })

watch(() => [form.wholesale_markup_percent, form.cost_price], () => {
  if (updatingFromWholesalePrice || loadingProduct) return
  const cost = Number(form.cost_price) || 0
  const markupPercent = Number(form.wholesale_markup_percent) || 0
  if (cost > 0 && markupPercent > 0) {
    form.wholesale_price = Math.round(cost * (1 + markupPercent / 100))
    form.wholesale_markup_amount = Number((form.wholesale_price - cost).toFixed(2))
  }
}, { deep: true })

watch(() => [form.promo_price, form.cost_price], () => {
  if (loadingProduct) return
  const cost = Number(form.cost_price) || 0
  const price = Number(form.promo_price) || 0
  if (cost > 0 && price > 0) {
    updatingFromPromoPrice = true
    form.promo_markup_percent = Number((((price - cost) / cost) * 100).toFixed(2))
    nextTick(() => { updatingFromPromoPrice = false })
  }
}, { deep: true })

watch(() => [form.promo_markup_percent, form.cost_price], () => {
  if (updatingFromPromoPrice || loadingProduct) return
  const cost = Number(form.cost_price) || 0
  const markupPercent = Number(form.promo_markup_percent) || 0
  if (cost > 0 && markupPercent > 0) {
    form.promo_price = Math.round(cost * (1 + markupPercent / 100))
  }
}, { deep: true })

const valid = ref(false)
const barcodeManuallyEntered = ref(false)
const scanPhase = ref(true)
const barcodeInput = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, (open) => {
  if (open && !isEdit.value) {
    scanPhase.value = true
    nextTick(() => {
      setTimeout(() => barcodeInput.value?.focus(), 100)
    })
  } else if (open && isEdit.value) {
    scanPhase.value = false
  }
})

function proceedToFullForm () {
  scanPhase.value = false
}

function skipBarcode () {
  form.barcode = ''
  barcodeManuallyEntered.value = true
  scanPhase.value = false
}

const requiredRules = [(v: any) => !!v || 'Required']


function submit () {
  if (!valid.value) return
  calculatePrices()
  emit('save', { ...form })
}

function cancel () {
  isOpen.value = false
}

const showBrandDialog = ref(false)
const newBrandName = ref('')
const brandDuplicate = computed(() =>
  (brands.value ?? []).some(b => b.name.toLowerCase().trim() === newBrandName.value.toLowerCase().trim())
)

const showUnitDialog = ref(false)
const newUnitName = ref('')
const newUnitAbbrev = ref('')
const unitDuplicate = computed(() =>
  (units.value ?? []).some(u =>
    u.name.toLowerCase().trim() === newUnitName.value.toLowerCase().trim() ||
    u.abbreviation.toLowerCase().trim() === newUnitAbbrev.value.toLowerCase().trim()
  )
)

const showCategoryDialog = ref(false)
const newCategoryName = ref('')
const newCategoryCode = ref('')
const categoryCodeTouched = ref(false)
const categoryDuplicate = computed(() =>
  (categories.value ?? []).some(c =>
    c.name.toLowerCase().trim() === newCategoryName.value.toLowerCase().trim() &&
    !c.parent_id
  )
)

const newSubCategoryDialog = ref(false)
const newSubCategoryName = ref('')
const newSubCategoryCode = ref('')
const subCategoryCodeTouched = ref(false)
const subCategoryDuplicate = computed(() =>
  (categories.value ?? []).some(c =>
    c.name.toLowerCase().trim() === newSubCategoryName.value.toLowerCase().trim() &&
    c.parent_id === form.category_id
  )
)

function generateCategoryCode (name: string): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]?.slice(0, 5) ?? ''
  return words.map(w => w[0]).join('').slice(0, 6)
}

watch(newCategoryName, (name) => {
  if (!categoryCodeTouched.value) newCategoryCode.value = generateCategoryCode(name)
})

watch(newSubCategoryName, (name) => {
  if (!subCategoryCodeTouched.value) newSubCategoryCode.value = generateCategoryCode(name)
})

async function saveNewBrand () {
  if (!newBrandName.value.trim() || brandDuplicate.value) return
  const created = await createBrand({ name: newBrandName.value.trim(), is_active: true })
  if (created) {
    await fetchBrands()
    form.brand_id = created.id
    showBrandDialog.value = false
    newBrandName.value = ''
  }
}

async function saveNewUnit () {
  if (!newUnitName.value.trim() || !newUnitAbbrev.value.trim() || unitDuplicate.value) return
  const created = await createUnit({ name: newUnitName.value.trim(), abbreviation: newUnitAbbrev.value.trim(), is_active: true })
  if (created) {
    await fetchUnits()
    form.unit_id = created.id
    showUnitDialog.value = false
    newUnitName.value = ''
    newUnitAbbrev.value = ''
  }
}

async function saveNewCategory () {
  if (!newCategoryName.value.trim() || categoryDuplicate.value) return
  const created = await createCategory({
    name: newCategoryName.value.trim(),
    code: newCategoryCode.value.trim() || undefined,
    parent_id: null,
    is_active: true
  })
  if (created) {
    await fetchCategories()
    form.category_id = created.id
    showCategoryDialog.value = false
    newCategoryName.value = ''
    newCategoryCode.value = ''
    categoryCodeTouched.value = false
  }
}

const packageProductItems = computed(() =>
  (allProducts.value ?? []).filter(p => p.id !== props.product?.id && p.product_type !== 'package')
)

function addPackageItem () {
  if (!form.package_items) form.package_items = []
  form.package_items.push({ product_id: null as any, quantity: 1 })
}

async function saveNewSubCategory () {
  if (!newSubCategoryName.value.trim() || !form.category_id || subCategoryDuplicate.value) return
  const created = await createCategory({
    name: newSubCategoryName.value.trim(),
    code: newSubCategoryCode.value.trim() || undefined,
    parent_id: form.category_id,
    is_active: true
  })
  if (created) {
    await fetchCategories()
    form.sub_category_id = created.id
    newSubCategoryDialog.value = false
    newSubCategoryName.value = ''
    newSubCategoryCode.value = ''
    subCategoryCodeTouched.value = false
  }
}

function resetFormAndKeepOpen () {
  resetForm()
  barcodeManuallyEntered.value = false
  duplicateResults.value = []
  scanPhase.value = true
  nextTick(async () => {
    const seq = await fetchNextSequence()
    if (seq) {
      form.product_sequence = seq
    }
    setTimeout(() => barcodeInput.value?.focus(), 100)
  })
}

let sequenceBarcodeSync = false
watch(() => form.product_sequence, (sequence) => {
  if (barcodeManuallyEntered.value) return
  if (sequenceBarcodeSync) return
  sequenceBarcodeSync = true
  form.barcode = sequence ?? ''
  sequenceBarcodeSync = false
})

watch(() => form.barcode, (barcode) => {
  if (sequenceBarcodeSync) return
  if (!barcode) {
    barcodeManuallyEntered.value = false
    form.barcode = form.product_sequence ?? ''
    return
  }
  if (barcode !== form.product_sequence) {
    barcodeManuallyEntered.value = true
  }
})

let duplicateDebounce: ReturnType<typeof setTimeout> | null = null
function searchDuplicates () {
  if (duplicateDebounce) clearTimeout(duplicateDebounce)
  duplicateDebounce = setTimeout(async () => {
    await checkDuplicate(
      form.product_sequence,
      form.barcode,
      form.name,
      props.product?.id
    )
  }, 350)
}

watch(
  () => [form.product_sequence, form.barcode, form.name],
  () => searchDuplicates(),
  { deep: true }
)
</script>

<template>
  <AppDialog
    v-model="isOpen"
    :max-width="scanPhase && !isEdit ? 480 : 1180"
    persistent
    scrollable
    :transition="scanPhase && !isEdit ? 'dialog-bottom-transition' : 'dialog-transition'"
    no-header
    class="d-flex flex-column"
    style="max-height: 100%"
  >
    <v-toolbar color="primary">
      <v-icon class="ml-3" color="white">mdi-barcode-scan</v-icon>
      <v-toolbar-title class="text-white ml-2">
        {{ isEdit ? 'Edit Product' : scanPhase ? 'Scan Barcode' : 'Add New Product' }}
      </v-toolbar-title>
      <v-spacer />
      <span class="text-white font-weight-bold mr-4">Product Registry</span>
      <v-btn icon="mdi-close" variant="text" color="white" @click="cancel" />
    </v-toolbar>

      <!-- Quick-scan phase: barcode only -->
      <v-card-text v-if="scanPhase && !isEdit" class="pa-6">
        <div class="text-center mb-4">
          <v-icon size="64" color="primary" class="mb-2">mdi-barcode-scan</v-icon>
          <h2 class="text-h6 font-weight-bold mb-1">Input the Item Barcode</h2>
          <p class="text-body-2 text-medium-emphasis">Scan or type the barcode, then press Enter to continue</p>
        </div>
        <v-text-field
          ref="barcodeInput"
          v-model="form.barcode"
          label="Item Barcode"
          placeholder="Scan or type barcode here..."
          variant="outlined"
          autofocus
          hide-details="auto"
          prepend-inner-icon="mdi-barcode"
          @keyup.enter="proceedToFullForm"
        >
          <template #append>
            <v-btn color="primary" @click="proceedToFullForm" :disabled="!form.barcode">
              Continue
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <div class="d-flex justify-center mt-4">
          <v-btn color="secondary" prepend-icon="mdi-keyboard-off" @click="skipBarcode">
            No Barcode — Skip
          </v-btn>
        </div>
        <v-alert v-if="duplicateList.length" type="warning" density="compact" class="mt-3">
          {{ duplicateList.length }} existing product(s) found with this barcode
        </v-alert>
      </v-card-text>

      <!-- Full form phase -->
      <v-form v-else v-model="valid" @submit.prevent="submit" class="d-flex flex-column flex-grow-1 overflow-hidden">
        <v-card-text class="pa-3 flex-grow-1 overflow-y-auto">
              <!-- Basic Information (includes Inventory + Pricing) -->
                  <v-card variant="outlined" class="mb-3">
                    <v-card-text class="pa-3">
                       <v-row dense>
                        
                        <v-col cols="6" md="3">
                          <v-text-field
                            v-model="form.product_sequence"
                            label="P-SEQ"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            readonly
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-text-field
                            v-model="form.barcode"
                            label="Barcode"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-text-field
                            v-model="form.special_code"
                            label="Special Code"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                          />
                        </v-col>
                       
                      </v-row>
                     
                      <v-row dense  class="mt-3">
                        <v-col cols="6" md="3">
                          <v-select
                            v-model="form.brand_id"
                            label="Brand"
                            :items="brandItems"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            clearable
                            append-inner-icon="mdi-plus"
                            @click:append-inner="showBrandDialog = true"
                          />
                        </v-col>
                        <v-col cols="6" md="9">
                           <v-text-field
                            v-model="form.name"
                            label="Product Name"
                            :rules="requiredRules"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            class="mb-3"
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-select
                            v-model="form.unit_id"
                            label="Unit"
                            :items="unitItems"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            clearable
                            append-inner-icon="mdi-plus"
                            @click:append-inner="showUnitDialog = true"
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-select
                            v-model="form.category_id"
                            label="Category"
                            :items="categoryItems"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            clearable
                            append-inner-icon="mdi-plus"
                            @click:append-inner="showCategoryDialog = true"
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-select
                            v-model="form.sub_category_id"
                            label="Sub-Category"
                            :items="subCategoryItems"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            clearable
                            :disabled="!form.category_id"
                            append-inner-icon="mdi-plus"
                            @click:append-inner="form.category_id ? (newSubCategoryDialog = true) : null"
                          />
                        </v-col>
                         <v-col cols="6" md="3">
                          <v-select
                            v-model="form.product_type"
                            label="Type"
                            :items="typeItems"
                            item-title="title"
                            item-value="value"
                            :rules="requiredRules"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                          />
                        </v-col>
                      </v-row>
                     
                      <v-row dense class="mt-3">
                       
                        <v-col cols="6" md="3">
                          <v-select
                            v-model="form.supplier_id"
                            label="Supplier"
                            :items="supplierItems"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            clearable
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-text-field
                            v-model.number="form.reorder_level"
                            label="Reorder Level"
                            type="number"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                          />
                        </v-col>
                        <v-col cols="6" md="3">
                          <v-select
                            v-model="form.warranty_period"
                            label="Warranty Period"
                            :items="[
                              '7 Days',
                              '1 Month',
                              '3 Months',
                              '6 Months',
                              '1 Year',
                              '2 Years'
                            ]"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            clearable
                          />
                        </v-col>
                      </v-row>

                     

                      <!-- Pricing -->
                      <v-row dense class="mt-3">
                        <!-- Costing -->
                        <v-col cols="12" md="3">
                          <div class="pricing-box pricing-costing">
                            <div class="pricing-header pricing-costing-header">
                              [ F7 ] Costing
                            </div>
                            <div class="pricing-body pricing-costing-body">
                              <v-text-field
                                v-model.number="form.cost_price"
                                label="Capital Price"
                                type="number"
                                prefix="₱"
                                variant="outlined"
                                density="compact"
                                hide-details="auto"
                              />
                            </div>
                          </div>
                        </v-col>
                        <!-- Regular / Retail -->
                        <v-col cols="12" md="3">
                          <div class="pricing-box pricing-retail">
                            <div class="pricing-header pricing-retail-header">
                              [ F8 ] Regular / Retail
                            </div>
                            <div class="pricing-body pricing-retail-body">
                              <v-row dense>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model.number="form.markup_percent"
                                    label="Markup %"
                                    type="number"
                                    suffix="%"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                    @blur="onMarkupBlur"
                                  />
                                </v-col>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model.number="form.regular_price"
                                    label="Price"
                                    type="number"
                                    prefix="₱"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                              </v-row>
                            </div>
                          </div>
                        </v-col>
                        <!-- Wholesale -->
                        <v-col cols="12" md="3">
                          <!-- <div class="pricing-box pricing-wholesale"> -->
                            <!-- <div class="pricing-header pricing-wholesale-header">
                              [ F9 ] Wholesale
                            </div> -->
                            <!-- <div class="pricing-body pricing-wholesale-body"> -->
                              <!-- <v-row dense>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model.number="form.wholesale_markup_percent"
                                    label="Markup %"
                                    type="number"
                                    suffix="%"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model.number="form.wholesale_price"
                                    label="Price"
                                    type="number"
                                    prefix="₱"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                              </v-row> -->
                            <!-- </div> -->
                          <!-- </div> -->
                        </v-col>
                        <!-- Promo -->
                        <v-col cols="12" md="3">
                          <!-- <div class="pricing-box pricing-promo">
                            <div class="pricing-header pricing-promo-header">
                              [ + ] Promo
                            </div>
                            <div class="pricing-body pricing-promo-body">
                              <v-row dense>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model.number="form.promo_markup_percent"
                                    label="Markup %"
                                    type="number"
                                    suffix="%"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                                <v-col cols="12" md="6">
                                  <v-text-field
                                    v-model.number="form.promo_price"
                                    label="Promo Price"
                                    type="number"
                                    prefix="₱"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                              </v-row>
                            </div>
                          </div> -->
                        </v-col>
                      </v-row>
                      <v-row dense class="mt-3">
                        <v-col cols="6" md="3">
                          <v-switch
                            v-model="form.has_expiry"
                            label="Has Expiry"
                            color="primary"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                        <v-col v-if="form.has_expiry" cols="6" md="3">
                          <v-text-field
                            v-model="form.expiry_date"
                            label="Expiry Date"
                            type="date"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                          />
                        </v-col>
                      </v-row>
                       <!-- Package / Item Kit editor -->
                      <v-row v-if="form.product_type === 'package'" dense class="mt-3">
                        <v-col cols="12">
                          <v-card variant="outlined">
                            <v-card-title class="text-subtitle-2 d-flex align-center">
                              <v-icon size="18" class="mr-2">mdi-package-variant</v-icon>
                              Package Contents
                              <v-spacer />
                              <v-btn color="primary" prepend-icon="mdi-plus" @click="addPackageItem">
                                Add Item
                              </v-btn>
                            </v-card-title>
                            <v-card-text class="pa-2">
                              <v-row v-for="(item, idx) in form.package_items" :key="idx" dense align="center">
                                <v-col cols="7">
                                  <v-select
                                    v-model="item.product_id"
                                    label="Product"
                                    :items="packageProductItems"
                                    item-title="name"
                                    item-value="id"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                                <v-col cols="3">
                                  <v-text-field
                                    v-model.number="item.quantity"
                                    label="Qty"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    hide-details="auto"
                                  />
                                </v-col>
                                <v-col cols="2" class="text-right">
                                  <v-btn icon="mdi-delete" variant="text" color="error" @click="form.package_items?.splice(idx, 1)" />
                                </v-col>
                              </v-row>
                              <p v-if="!form.package_items?.length" class="text-body-2 text-medium-emphasis pa-2">
                                No items added yet.
                              </p>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

              <!-- Duplicate checker (always visible at bottom) -->
              <v-card v-if="false" variant="outlined" :color="duplicateList.length ? 'warning' : 'info'" class="pa-2 mt-3">
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-1">mdi-content-duplicate</v-icon>
                  <span class="text-subtitle-2 font-weight-bold">
                    Existing / Duplicate Product Input Checker
                  </span>
                  <v-chip v-if="duplicateList.length" size="x-small" color="warning" class="ml-2">
                    {{ duplicateList.length }} found
                  </v-chip>
                  <v-chip v-else size="x-small" color="success" class="ml-2">
                    No duplicates
                  </v-chip>
                </div>
                <v-table v-if="duplicateList.length" density="compact" class="duplicate-table">
                  <thead>
                    <tr>
                      <th class="text-left" style="width: 90px">Seq</th>
                      <th class="text-left" style="width: 90px">Barcode</th>
                      <th class="text-left">Item Name</th>
                      <th class="text-left" style="width: 70px">Unit</th>
                      <th class="text-right" style="width: 80px">Cost</th>
                      <th class="text-right" style="width: 80px">Retail</th>
                      <th class="text-right" style="width: 80px">WL-Sale</th>
                      <th class="text-left" style="width: 100px">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="dup in duplicateList" :key="dup.id">
                      <td>{{ dup.product_sequence }}</td>
                      <td>{{ dup.barcode }}</td>
                      <td>{{ dup.name }}</td>
                      <td>{{ dup.unit?.abbreviation }}</td>
                      <td class="text-right">{{ formatAmount(dup.cost_price) }}</td>
                      <td class="text-right">{{ formatAmount(dup.regular_price) }}</td>
                      <td class="text-right">{{ formatAmount(dup.wholesale_price) }}</td>
                      <td>{{ dup.category?.name }}</td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-else class="text-body-2 text-medium-emphasis py-2">
                  No existing products match the current barcode, sequence, or name.
                </div>
              </v-card>
        </v-card-text>

        <!-- Bottom action buttons -->
        <v-card-actions class="pa-3 flex-shrink-0 ga-2">
          <v-btn color="error" variant="elevated" prepend-icon="mdi-close" :disabled="loading" @click="cancel">
            Close
          </v-btn>
          <v-btn v-if="!isEdit" color="secondary" variant="elevated" prepend-icon="mdi-arrow-left" @click="scanPhase = true">
            Back to Scan
          </v-btn>
          <v-spacer />
          <v-btn v-if="isEdit" color="indigo" variant="elevated" prepend-icon="mdi-barcode" :disabled="!form.barcode" class="d-none d-md-inline-flex" @click="printBarcode">
            Print Barcode
          </v-btn>
          <v-btn v-if="isEdit" color="teal" variant="elevated" prepend-icon="mdi-magnify" class="d-none d-md-inline-flex" @click="openSerials">
            View Serials
          </v-btn>
          <v-btn
            type="submit"
            variant="elevated"
            :color="isEdit ? 'primary' : 'success'"
            :prepend-icon="isEdit ? 'mdi-content-save-edit' : 'mdi-content-save'"
            :loading="loading"
          >
            {{ isEdit ? 'Update' : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-form>

    <!-- Quick Add Brand Dialog -->
    <AppDialog
      v-model="showBrandDialog"
      title="Add New Brand"
      icon="mdi-tag-plus"
      max-width="400"
      persistent
    >
      <v-card-text>
        <v-text-field
          v-model="newBrandName"
          label="Brand Name"
          variant="outlined"
          density="compact"
          hide-details="auto"
          autofocus
          :error-messages="brandDuplicate ? 'Brand already exists' : ''"
          @keyup.enter="saveNewBrand"
        />
      </v-card-text>
      <v-card-actions class="border-t pa-3">
        <v-spacer />
        <v-btn variant="text" @click="showBrandDialog = false; newBrandName = ''">Cancel</v-btn>
        <v-btn color="primary" :disabled="!newBrandName.trim() || brandDuplicate" @click="saveNewBrand">Add</v-btn>
      </v-card-actions>
    </AppDialog>

    <!-- Quick Add Unit Dialog -->
    <AppDialog
      v-model="showUnitDialog"
      title="Add New Unit"
      icon="mdi-ruler-plus"
      max-width="400"
      persistent
    >
      <v-card-text>
        <v-text-field
          v-model="newUnitName"
          label="Unit Name"
          variant="outlined"
          density="compact"
          hide-details="auto"
          autofocus
          class="mb-3"
          :error-messages="unitDuplicate ? 'Name or abbreviation already exists' : ''"
        />
        <v-text-field
          v-model="newUnitAbbrev"
          label="Abbreviation"
          variant="outlined"
          density="compact"
          hide-details="auto"
          @keyup.enter="saveNewUnit"
        />
      </v-card-text>
      <v-card-actions class="border-t pa-3">
        <v-spacer />
        <v-btn variant="text" @click="showUnitDialog = false; newUnitName = ''; newUnitAbbrev = ''">Cancel</v-btn>
        <v-btn color="primary" :disabled="!newUnitName.trim() || !newUnitAbbrev.trim() || unitDuplicate" @click="saveNewUnit">Add</v-btn>
      </v-card-actions>
    </AppDialog>

    <!-- Quick Add Category Dialog -->
    <AppDialog
      v-model="showCategoryDialog"
      title="Add New Category"
      icon="mdi-folder-plus"
      max-width="400"
      persistent
    >
      <v-card-text>
        <v-text-field
          v-model="newCategoryName"
          label="Category Name"
          variant="outlined"
          density="compact"
          hide-details="auto"
          autofocus
          class="mb-3"
          :error-messages="categoryDuplicate ? 'Category already exists' : ''"
          @keyup.enter="saveNewCategory"
        />
      </v-card-text>
      <v-card-actions class="border-t pa-3">
        <v-spacer />
        <v-btn variant="text" @click="showCategoryDialog = false; newCategoryName = ''; newCategoryCode = ''; categoryCodeTouched = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!newCategoryName.trim() || categoryDuplicate" @click="saveNewCategory">Add</v-btn>
      </v-card-actions>
    </AppDialog>

    <!-- Quick Add Sub-Category Dialog -->
    <AppDialog
      v-model="newSubCategoryDialog"
      title="Add New Sub-Category"
      icon="mdi-folder-plus-outline"
      max-width="400"
      persistent
    >
      <v-card-text>
        <v-text-field
          v-model="newSubCategoryName"
          label="Sub-Category Name"
          variant="outlined"
          density="compact"
          hide-details="auto"
          autofocus
          class="mb-3"
          :error-messages="subCategoryDuplicate ? 'Sub-Category already exists under this category' : ''"
          @keyup.enter="saveNewSubCategory"
        />
      </v-card-text>
      <v-card-actions class="border-t pa-3">
        <v-spacer />
        <v-btn variant="text" @click="newSubCategoryDialog = false; newSubCategoryName = ''; newSubCategoryCode = ''; subCategoryCodeTouched = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!newSubCategoryName.trim() || subCategoryDuplicate" @click="saveNewSubCategory">Add</v-btn>
      </v-card-actions>
    </AppDialog>

    <!-- Serials Dialog -->
    <AppDialog
      v-model="showSerialsDialog"
      title="Serials"
      :subtitle="props.product?.name"
      icon="mdi-barcode-scan"
      max-width="520"
      scrollable
    >
      <v-card-text class="pa-0" style="max-height: 400px">
        <v-progress-linear v-if="serialsLoading" indeterminate color="primary" />
        <v-table v-else-if="serials.length" density="compact">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in serials" :key="s.id">
              <td>{{ s.serial_number }}</td>
              <td>
                <v-chip
                  size="x-small"
                  :color="({ in_stock: 'success', sold: 'info', defective: 'error', returned: 'warning' } as Record<string, string>)[s.status] ?? 'grey'"
                >
                  {{ s.status }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div v-else class="pa-4 text-body-2 text-medium-emphasis">
          No serials found for this product.
        </div>
      </v-card-text>
      <v-card-actions class="border-t pa-3">
        <v-spacer />
        <v-btn variant="text" @click="showSerialsDialog = false">Close</v-btn>
      </v-card-actions>
    </AppDialog>
  </AppDialog>
</template>
