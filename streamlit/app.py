import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import json
from sklearn.ensemble import RandomForestRegressor

# ---------------- CONFIG ----------------
st.set_page_config(page_title="AI Readiness Analytics", layout="wide", page_icon="📊")
# ---------------- STYLE ----------------
st.markdown("""
<style>
    .block-container { padding-top: 1.5rem; }
    .metric-card {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 16px 20px;
        border-left: 4px solid #4F63FF;
    }
    .insight-box {
        background: #eef2ff;
        border-radius: 10px;
        padding: 16px 20px;
        border-left: 4px solid #4F63FF;
        margin-bottom: 12px;
    }
    .warning-box {
        background: #fff7ed;
        border-radius: 10px;
        padding: 16px 20px;
        border-left: 4px solid #f97316;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------- LOAD DATA ----------------

# Value → Label maps (survey values → Russian display labels)
SECTOR_MAP = {
    "b2b_services":   "Услуги для бизнеса",
    "retail":         "Розница / e-commerce",
    "education":      "Образование",
    "health":         "Медицина / wellness",
    "operations":     "Производство / логистика",
    "other":          "Другое",
}

STAGE_MAP = {
    "early":      "Первые продажи",
    "stable":     "Стабильная выручка",
    "scaling":    "Растем и нанимаем",
    "systemize":  "Нужна систематизация",
}

SALES_MODEL_MAP = {
    "b2b":      "B2B",
    "b2c":      "B2C",
    "mixed":    "B2B + B2C",
    "partners": "Маркетплейсы / партнеры",
}

TEAM_SIZE_MAP = {
    "1-2":    "1–2 человека",
    "3-10":   "3–10 человек",
    "11-30":  "11–30 человек",
    "31-100": "31–100 человек",
    "100+":   "100+ человек",
}

def apply_maps(df: pd.DataFrame) -> pd.DataFrame:
    """Replace English survey values with Russian display labels."""
    df = df.copy()

    if "Сфера" in df.columns:
        df["Сфера"] = df["Сфера"].map(lambda x: SECTOR_MAP.get(x, x))
    if "Стадия" in df.columns:
        df["Стадия"] = df["Стадия"].map(lambda x: STAGE_MAP.get(x, x))
    if "Модель продаж" in df.columns:
        df["Модель продаж"] = df["Модель продаж"].map(lambda x: SALES_MODEL_MAP.get(x, x))
    if "Размер команды" in df.columns:
        df["Размер команды"] = df["Размер команды"].map(lambda x: TEAM_SIZE_MAP.get(x, x))

    # Dimension block keys → Russian labels
    # Значения в колонках "Сильная зона" и "Слабые зоны"
    BLOCK_MAP = {
        "sales_support":  "Продажи и Клиентский сервис",
        "automation":     "Рутинные процессы",
        "data_knowledge": "Данные и База знаний",
        "predictive_ops": "Операционка и Прогнозы",
        "culture_ready":  "Культура и Готовность команды",
    }

    if "Сильная зона" in df.columns:
        df["Сильная зона"] = df["Сильная зона"].map(lambda x: BLOCK_MAP.get(x, x))

    if "Слабые зоны" in df.columns:
        # Может быть несколько через запятую: "sales_support, automation"
        def map_weak(val):
            if pd.isna(val):
                return val
            parts = [v.strip() for v in str(val).split(",")]
            return ", ".join(BLOCK_MAP.get(p, p) for p in parts)
        df["Слабые зоны"] = df["Слабые зоны"].map(map_weak)
    # Level keys → Russian labels
    LEVEL_MAP = {
        "analog":            "Аналоговый бизнес",
        "point_potential":   "Точечный потенциал",
        "transformation":    "AI-Трансформация",
        "ai_leader":         "AI-Лидер",
    }
    if "Уровень" in df.columns:
        df["Уровень"] = df["Уровень"].map(lambda x: LEVEL_MAP.get(x, x))

    return df


@st.cache_data
def load_data():
    df = pd.read_csv("friday.csv")
    df["Дата"] = pd.to_datetime(df["Дата"], errors="coerce")

    # Dimensions: convert object cols to numeric
    dim_cols = [
        "Продажи и Клиентский сервис",
        "Рутинные процессы",
        "Данные и База знаний",
        "Операционка и Прогнозы",
        "Культура и Готовность команды"
    ]
    for col in dim_cols:
        if df[col].dtype == object:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df

df = apply_maps(load_data())

DIMS = [
    "Продажи и Клиентский сервис",
    "Рутинные процессы",
    "Данные и База знаний",
    "Операционка и Прогнозы",
    "Культура и Готовность команды"
]

DIM_SHORT = {
    "Продажи и Клиентский сервис": "Продажи",
    "Рутинные процессы": "Рутина",
    "Данные и База знаний": "Данные",
    "Операционка и Прогнозы": "Операционка",
    "Культура и Готовность команды": "Культура"
}

PALETTE = ["#4F63FF", "#10b981", "#f97316", "#e11d48", "#8b5cf6"]

# ---------------- SIDEBAR FILTERS ----------------
st.sidebar.header("🔍 Фильтры")

sector = st.sidebar.multiselect("Сфера", sorted(df["Сфера"].dropna().unique()))
stage = st.sidebar.multiselect("Стадия", sorted(df["Стадия"].dropna().unique()))
team_size = st.sidebar.multiselect("Размер команды", sorted(df["Размер команды"].dropna().unique()))
level = st.sidebar.multiselect("Уровень", sorted(df["Уровень"].dropna().unique()))
sales_model = st.sidebar.multiselect("Модель продаж", sorted(df["Модель продаж"].dropna().unique()))
device = st.sidebar.multiselect("Устройство", sorted(df["Device"].dropna().unique()))
language = st.sidebar.multiselect("Язык", sorted(df["Language"].dropna().unique()))

filtered = df.copy()
if sector:      filtered = filtered[filtered["Сфера"].isin(sector)]
if stage:       filtered = filtered[filtered["Стадия"].isin(stage)]
if team_size:   filtered = filtered[filtered["Размер команды"].isin(team_size)]
if level:       filtered = filtered[filtered["Уровень"].isin(level)]
if sales_model: filtered = filtered[filtered["Модель продаж"].isin(sales_model)]
if device:      filtered = filtered[filtered["Device"].isin(device)]
if language:    filtered = filtered[filtered["Language"].isin(language)]

n = len(filtered)

# ---------------- HEADER ----------------
st.title("📊 Аналитика готовности к ИИ")
st.caption(f"Всего ответов в выборке: **{n}** из {len(df)}")
st.divider()

# ---- KPIs ----
avg_score  = filtered["Score"].mean()      if n > 0 else 0
avg_lead   = filtered["Lead Score"].mean() if n > 0 else 0
top_sector = filtered["Сфера"].mode()[0]   if n > 0 else "—"
top_level  = filtered["Уровень"].mode()[0] if n > 0 else "—"

col1, col2, col3, col4 = st.columns(4)
col1.metric("⭐ Средний Score",      f"{avg_score:.1f}")
col2.metric("🎯 Средний Lead Score", f"{avg_lead:.1f}")
col3.metric("🏢 Топ сфера",          top_sector)
col4.metric("📈 Частый уровень",     top_level)

st.divider()

# ---------------- TABS ----------------
tab1, tab2, tab3 = st.tabs([
    "🗺️ Обзор",
    "🧠 Компетенции",
    "🔍 Сырые данные"
])

# ===================== TAB 1: OVERVIEW =====================
with tab1:
    st.subheader("Быстрый профиль выборки")

    if n == 0:
        st.warning("Нет данных для отображения. Измените фильтры.")
        st.stop()

    col_a, col_b = st.columns(2)

    with col_a:
        # Distribution by stage
        st.markdown("**По стадии**")
        stage_counts = filtered["Стадия"].value_counts()
        fig, ax = plt.subplots(figsize=(5, 3))
        ax.barh(stage_counts.index, stage_counts.values, color=PALETTE[0])
        ax.set_xlabel("Количество")
        ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

    with col_b:
        # Distribution by sector
        st.markdown("**По сфере**")
        sector_counts = filtered["Сфера"].value_counts()
        fig, ax = plt.subplots(figsize=(5, 3))
        wedges, texts, autotexts = ax.pie(
            sector_counts.values,
            labels=sector_counts.index,
            autopct="%1.0f%%",
            colors=PALETTE,
            startangle=90
        )
        for t in autotexts: t.set_fontsize(8)
        for t in texts: t.set_fontsize(8)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

    col_c, col_d = st.columns(2)

    with col_c:
        st.markdown("**По уровню (Score)**")
        level_avg = filtered.groupby("Уровень")["Score"].mean().sort_values()
        fig, ax = plt.subplots(figsize=(5, 3))
        ax.barh(level_avg.index, level_avg.values, color=PALETTE[2])
        ax.set_xlabel("Средний Score")
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

    with col_d:
        st.markdown("**По модели продаж**")
        sales_avg = filtered.groupby("Модель продаж")[["Score", "Lead Score"]].mean()
        fig, ax = plt.subplots(figsize=(5, 3))
        x = np.arange(len(sales_avg))
        ax.bar(x - 0.2, sales_avg["Score"], width=0.35, label="Score", color=PALETTE[0])
        ax.bar(x + 0.2, sales_avg["Lead Score"], width=0.35, label="Lead Score", color=PALETTE[1])
        ax.set_xticks(x)
        ax.set_xticklabels(sales_avg.index, fontsize=8)
        ax.legend(fontsize=8)
        fig.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

# ===================== TAB 3: COMPETENCES =====================
with tab2:
    st.subheader("Профиль компетенций")

    if n == 0:
        st.info("Нет данных.")
    else:
        dim_means = filtered[DIMS].mean()
        dim_labels = [DIM_SHORT[d] for d in DIMS]

        col_a, col_b = st.columns([1.5, 1])

        with col_a:
            # Radar chart with matplotlib
            angles = np.linspace(0, 2 * np.pi, len(DIMS), endpoint=False).tolist()
            values_radar = dim_means.values.tolist()
            # Close the loop
            angles += angles[:1]
            values_radar += values_radar[:1]

            fig, ax = plt.subplots(figsize=(5, 5), subplot_kw=dict(polar=True))
            ax.plot(angles, values_radar, color=PALETTE[0], linewidth=2)
            ax.fill(angles, values_radar, color=PALETTE[0], alpha=0.2)
            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(dim_labels, fontsize=9)
            ax.set_title("Радар компетенций", fontsize=11, pad=20)
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)

        with col_b:
            st.markdown("**Средние значения**")
            for dim, val in dim_means.sort_values(ascending=False).items():
                pct = val / dim_means.max() if dim_means.max() > 0 else 0
                st.markdown(f"**{DIM_SHORT[dim]}**")
                st.progress(float(pct), text=f"{val:.2f}")

        # Dimension breakdown by segment
        st.divider()
        st.subheader("Компетенции по сегментам")
        seg_col = st.selectbox("Сегмент для анализа:", ["Сфера", "Стадия", "Размер команды", "Уровень", "Модель продаж"])
        seg_means = filtered.groupby(seg_col)[DIMS].mean()
        seg_means.columns = [DIM_SHORT[d] for d in DIMS]
        if not seg_means.empty:
            fig, ax = plt.subplots(figsize=(9, 4))
            x = np.arange(len(seg_means.columns))
            width = 0.8 / len(seg_means)
            for i, (label, row) in enumerate(seg_means.iterrows()):
                ax.bar(x + i * width - 0.4 + width / 2, row.values, width=width * 0.9,
                       label=str(label), color=PALETTE[i % len(PALETTE)])
            ax.set_xticks(x)
            ax.set_xticklabels(seg_means.columns, fontsize=9)
            ax.legend(fontsize=8, loc="upper right")
            ax.set_ylabel("Среднее значение")
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)

        # Strong/Weak zones from data
        st.divider()
        st.subheader("Сильные и слабые зоны (из ответов)")
        col_c, col_d = st.columns(2)
        with col_c:
            st.markdown("**Сильные зоны**")
            strong_counts = filtered["Сильная зона"].value_counts()
            fig, ax = plt.subplots(figsize=(5, 3))
            ax.barh(strong_counts.index, strong_counts.values, color=PALETTE[1])
            ax.set_xlabel("Частота")
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)
        with col_d:
            st.markdown("**Слабые зоны**")
            # Слабые зоны может быть несколько в строке, разбиваем
            weak_series = filtered["Слабые зоны"].dropna().str.split(",").explode().str.strip()
            weak_counts = weak_series.value_counts()
            fig, ax = plt.subplots(figsize=(5, 3))
            ax.barh(weak_counts.index, weak_counts.values, color=PALETTE[2])
            ax.set_xlabel("Частота")
            fig.tight_layout()
            st.pyplot(fig)
            plt.close(fig)

# ===================== TAB 7: RAW DATA =====================
with tab3:
    st.subheader("Данные")

    # JSON answers parsing attempt
    if "Ответы (JSON)" in filtered.columns:
        st.markdown("**Пример расшифровки ответов (JSON)**")
        try:
            sample_row = filtered["Ответы (JSON)"].dropna().iloc[0]
            parsed = json.loads(sample_row)
            st.json(parsed)
        except Exception:
            st.info("Не удалось распарсить JSON ответов.")

    display_cols = [
        "ID", "Дата", "Уровень", "Score", "Lead Score",
        "Сфера", "Стадия", "Размер команды", "Модель продаж",
        "Сильная зона", "Слабые зоны", "Landing Path", "Device", "Language"
    ]
    available_cols = [c for c in display_cols if c in filtered.columns]
    st.dataframe(filtered[available_cols].reset_index(drop=True), use_container_width=True)

    csv = filtered.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="⬇️ Скачать CSV",
        data=csv,
        file_name="filtered_data.csv",
        mime="text/csv"
    )

# ===================== FOOTER INSIGHTS =====================
st.divider()
st.subheader("🧠 Автоматические инсайты")

if n > 0:
    weak_dim  = filtered[DIMS].mean().idxmin()
    strong_dim = filtered[DIMS].mean().idxmax()
    top_lead_sector = filtered.groupby("Сфера")["Lead Score"].mean().idxmax() if n > 1 else "—"

    col_ins1, col_ins2, col_ins3 = st.columns(3)

    with col_ins1:
        st.markdown(f"""
<div class='insight-box'>
✅ <b>Сильная зона</b><br>
{strong_dim}<br>
<small>Среднее: {filtered[strong_dim].mean():.2f}</small>
</div>""", unsafe_allow_html=True)

    with col_ins2:
        st.markdown(f"""
<div class='warning-box'>
⚠️ <b>Слабая зона</b><br>
{weak_dim}<br>
<small>Среднее: {filtered[weak_dim].mean():.2f}</small>
</div>""", unsafe_allow_html=True)

    with col_ins3:
        st.markdown(f"""
<div class='insight-box'>
🎯 <b>Лучшая сфера по Lead Score</b><br>
{top_lead_sector}<br>
<small>Среднее Lead Score: {filtered.groupby("Сфера")["Lead Score"].mean().max():.1f}</small>
</div>""", unsafe_allow_html=True)

    # Extra: landing path performance
    lp_best = filtered.groupby("Landing Path")["Lead Score"].mean().idxmax()
    st.markdown(f"""
<div class='insight-box'>
📌 <b>Лучший Landing Path по Lead Score:</b> {lp_best} — Lead Score: {filtered.groupby("Landing Path")["Lead Score"].mean().max():.1f}
</div>""", unsafe_allow_html=True)