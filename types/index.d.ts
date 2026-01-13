import { Icons } from "@/components/icons/icons"
import { AccountType, FeatureType } from "./enums"
import { Moment } from "moment"

export type NavItem = {
  title: string
  href: string
  icon?: string
  disabled?: boolean
}

export type MainNavItem = NavItem
export type ModelsNav = NavItem
export type DatasetsNav = NavItem

export type SidebarNavItem = {
  title: string
  disabled?: boolean
  external?: boolean
  icon?: keyof typeof Icons
} & (
  | {
      href: string
      items?: never
    }
  | {
      href?: string
      items: NavLink[]
    }
)

export type SiteConfig = {
  name: string
  description: string
  url: string
  ogImage: string
}

export type DashboardConfig = {
  mainNav: MainNavItem[]
  modelsNav: ModelsNav[]
  datasetsNav: DatasetsNav[]
  settingSidebarNav: SidebarNavItem[]
  adminSidebarNav: SidebarNavItem[]
}

export type SubscriptionPlan = {
  name: string
  description: string
  stripePriceId: string
}

export type UserSubscriptionPlan = {
  accountType: AccountType
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  isPro: boolean
}

export type Organization = {
  name?: string
  organizationId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  email?: string
  apiKey: string
  accountType?: AccountType
  createdAt?: string
  stripeMetadata?: Record<string, string>
  stripeSubscriptionAmountsByProductId?: Record<string, number>
  stripeSubscriptionTotalMonthlyPaymentDollars?: string
}

export type Member = {
  organizationId: number
  organizationName?: string
  accountType: AccountType
  member_id: number
  email: string
  name?: string
  role: string
  status: string
}

export interface Model {
  model_name: string
  status: string
  created_at: string
  last_updated: string
  model_uri: string
}

export interface Feature {
  name: string
  type: string
}

export interface ModelSchema {
  interaction: Feature[]
  user: Feature[]
  item: Feature[]
}

export interface ModelConfig {
  name?: string
  pagination_store_ttl: int
  train_schedule: string
  text_index: boolean
  vector_index: boolean
  schema_override: object
  slate_size: int
  inference_config?: object
  policy_configs?: any
  interaction_max_per_user?: number
  interaction_expiration_days?: number
}

export interface ModelSetupArguments {
  connectors: Array<{ id: string; name: string; type: string }>
  fetch: string
  model: ModelConfig
}

export interface ModelDetails extends Model {
  error_message?: string
  warning_message?: string
  model_schema: ModelSchema
  trained_at: string
  config: ModelSetupArguments
  hyperparameters: any
}

export interface ModelTableSchema {
  name: string
  features: Feature[]
}

interface DatasetTableField {
  id: string
  fieldName: string
  fieldType: string
  accordionOpen: boolean
  nestedFields: DatasetTableField[]
}

export interface DatasetTableSchema {
  fields: DatasetTableField[]
  idToFieldMapping: Record<number, DatasetTableField>
}

export interface DataSet {
  id: string
  uri: string
  name: string
  transform_id: string
  transform_uri: string
  transform_name: string
  status: string
  created_at: string
  updated_at: string
}

export interface DatasetDetails extends DataSet {
  schema_type: string
  schema: Record<string, string>
  description: string
  source_table_names: string[]
  transform_type: string
  error_message?: string
  warning_message?: string
}
export interface AdminDatasetDetails {
  createdAt: string | null
  datasetConfig: DatasetConfig | null
  transformConfig: any
  datasetId: string | null
  datasetName: string
  transformName: string
  datasetSchema: Object | null
  deploymentType: string | null
  errorMessage: string | null
  kinesisIamRoleArn: string
  kinesisStreamArn: string | null
  schemaType: string | null
  status: string
  tenantId: string | null
  updatedAt: string | null
}

interface DatasetConfig {
  name?: string | null
  password?: string | null
  [key: string]: any // Allow additional properties
}
interface DataPoint {
  name: string
  value: number
}

interface ToolTipData extends DataPoint {
  color: string
  title: string
}

interface BarData extends DataPoint {
  color?: string
  alias: string
}

interface LineDataPoint {
  name: Moment
  value: number
}
interface LineData {
  title: string
  color: string
  data: LineDataPoint[]
}

interface LineChartToolTipData extends LineDataPoint {
  color: string
  title: string
}

interface GraphData {
  title: string
  latestValue: string
  color: string
}

interface ChartSelector {
  selectorName: string
  values: string[]
  defaultValue: string
}

interface TrainMetricsData {
  metricName: string
  modelType: string
  segmentation: string
  slateSize?: string
  data: DataPoint[]
}

interface TrainMetrics {
  evaluationData: TrainMetricsData[]
  summaryData: TrainMetricsData[]
}

interface OnlineMetricsData {
  timestamp: string
  shaped: number
}
interface OnlineMetrics {
  precision: OnlineMetricsData[]
  coverage: OnlineMetricsData[]
  attributedSessionCount: OnlineMetricsData[]
  sessionCount: OnlineMetricsData[]
  rankRequestCount: OnlineMetricsData[]
}

export interface ComboBoxData {
  attributeName: string
  attributeType: FeatureType
  uniqueValues?: string[]
}

export interface ComboBoxSelectedData {
  attributeName: string
  attributeType: FeatureType
  operator?: string
  value?: string
}

export interface FieldConfig {
  key: string
  label: string
  labelDescription: string
  type:
    | "text"
    | "password"
    | "number"
    | "date"
    | "datetime"
    | "select"
    | "multiselect"
    | "textarea"
    | "multiline"
    | "schemaEditor"
    | "schemaEditorWithoutType"
    | "column"
  options?: string[]
  optionsFrom?: string
}

export interface ConnectorConfig {
  displayName: string
  description: string
  docLink: string
  isNeededWhitelistPermission: boolean
  isNeededKinesisUri: boolean
  schemaType: string
  requiredFields: FieldConfig[]
  optionalFields: FieldConfig[]
}

export interface SchemaColumn {
  name: string
  type: string
  id: number
}

export interface FormData {
  [key: string]: any
}
