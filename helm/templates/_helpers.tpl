{{/*
Expand the name of the chart.
*/}}
{{- define "comments-system.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "comments-system.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "comments-system.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "comments-system.labels" -}}
helm.sh/chart: {{ include "comments-system.chart" . }}
{{ include "comments-system.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "comments-system.selectorLabels" -}}
app.kubernetes.io/name: {{ include "comments-system.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "comments-system.frontend.labels" -}}
{{ include "comments-system.labels" . }}
app.kubernetes.io/component: frontend
tier: frontend
{{- end }}

{{/*
Backend API labels
*/}}
{{- define "comments-system.backend-api.labels" -}}
{{ include "comments-system.labels" . }}
app.kubernetes.io/component: backend-api
tier: backend
{{- end }}

{{/*
Backend Data labels
*/}}
{{- define "comments-system.backend-data.labels" -}}
{{ include "comments-system.labels" . }}
app.kubernetes.io/component: backend-data
tier: backend
{{- end }}

{{/*
Database labels
*/}}
{{- define "comments-system.database.labels" -}}
{{ include "comments-system.labels" . }}
app.kubernetes.io/component: database
tier: database
{{- end }}