import requests
import logging
from typing import Dict, Any, List

logger = logging.getLogger("mandi_service")

# Static baseline and dynamic AP/Telangana Mandi Rates
MANDI_CATALOG = [
    {
        "mandi_name": "Guntur Mirchi Yard (గుంటూరు మార్కెట్)",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "crop": "Chilli (తేజ మిర్చి)",
        "variety": "Teja / Guntur Sannam",
        "min_price": 17500,
        "modal_price": 19800,
        "max_price": 22400,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 34200,
        "trend": "up",
        "change_rs": 350
    },
    {
        "mandi_name": "Warangal Enamamula Market (వరంగల్ మార్కెట్)",
        "district": "Warangal",
        "state": "Telangana",
        "crop": "Cotton (పత్తి)",
        "variety": "Bunny / Brahma",
        "min_price": 6800,
        "modal_price": 7450,
        "max_price": 7820,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 18500,
        "trend": "up",
        "change_rs": 120
    },
    {
        "mandi_name": "Khammam Mandi (ఖమ్మం మార్కెట్)",
        "district": "Khammam",
        "state": "Telangana",
        "crop": "Paddy (వరి - BPT)",
        "variety": "BPT 5204 (Samba Mahsuri)",
        "min_price": 2280,
        "modal_price": 2450,
        "max_price": 2580,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 42000,
        "trend": "stable",
        "change_rs": 0
    },
    {
        "mandi_name": "Kurnool APMC (కర్నూలు మార్కెట్)",
        "district": "Kurnool",
        "state": "Andhra Pradesh",
        "crop": "Groundnut (వేరుశనగ)",
        "variety": "K6 / Bold",
        "min_price": 5900,
        "modal_price": 6400,
        "max_price": 6850,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 12000,
        "trend": "up",
        "change_rs": 80
    },
    {
        "mandi_name": "Nizamabad Market Yard (నిజామాబాద్)",
        "district": "Nizamabad",
        "state": "Telangana",
        "crop": "Turmeric (పసుపు)",
        "variety": "Finger / Nizamabad Special",
        "min_price": 12200,
        "modal_price": 14100,
        "max_price": 15800,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 8900,
        "trend": "up",
        "change_rs": 450
    },
    {
        "mandi_name": "Suryapet Market (సూర్యాపేట)",
        "district": "Suryapet",
        "state": "Telangana",
        "crop": "Maize (మొక్కజొన్న)",
        "variety": "Hybrid Yellow",
        "min_price": 2150,
        "modal_price": 2280,
        "max_price": 2360,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 15400,
        "trend": "down",
        "change_rs": -30
    },
    {
        "mandi_name": "Vijayawada Gollapudi Market (విజయవాడ)",
        "district": "Krishna",
        "state": "Andhra Pradesh",
        "crop": "Paddy (వరి - సాధారణ రకం)",
        "variety": "Common Paddy MTU-1010",
        "min_price": 2183,
        "modal_price": 2203,
        "max_price": 2240,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 29000,
        "trend": "stable",
        "change_rs": 0
    },
    {
        "mandi_name": "Tandur APMC (తాండూరు మార్కెట్)",
        "district": "Vikarabad",
        "state": "Telangana",
        "crop": "Red Gram (కందులు / తాండూరు తొగరి)",
        "variety": "GI Tagged Tandur Redgram",
        "min_price": 9400,
        "modal_price": 10200,
        "max_price": 10850,
        "unit": "₹ / Quintal",
        "arrivals_qtl": 6700,
        "trend": "up",
        "change_rs": 180
    }
]

class MandiService:
    def get_mandi_prices(self, crop_query: str = None) -> List[Dict[str, Any]]:
        """Returns AP & Telangana mandi market rates filtered optionally by crop."""
        if not crop_query:
            return MANDI_CATALOG
        
        q = crop_query.lower()
        matched = []
        for item in MANDI_CATALOG:
            if (q in item["crop"].lower() or 
                q in item["variety"].lower() or 
                q in item["mandi_name"].lower() or 
                q in item["district"].lower()):
                matched.append(item)
        return matched if matched else MANDI_CATALOG

    def get_weather_feasibility(self, lat: float = 16.3067, lon: float = 80.4365, location_name: str = "Guntur / AP") -> Dict[str, Any]:
        """
        Fetches live agricultural weather from Open-Meteo (free, no auth required)
        and evaluates fertilizer/pesticide spraying feasibility for the farmer.
        """
        weather_info = {
            "location": location_name,
            "temperature_c": 31.5,
            "humidity_pct": 62,
            "wind_speed_kmh": 11.2,
            "rain_prob_pct": 10,
            "weather_condition": "Partly Cloudy",
            "is_spray_feasible": True,
            "feasibility_badge": "OPTIMAL (అనుకూలం)",
            "advisory_te": "ప్రస్తుతం గాలి వేగం మరియు తేమ అనుకూలంగా ఉన్నాయి. ఉదయం 10 గంటల లోపు మందు పిచికారీ పూర్తి చేయండి.",
            "advisory_en": "Weather conditions are optimal for spraying. Complete spray before 10 AM to prevent thermal evaporation."
        }

        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                
                temp = current.get("temperature_2m", 31.0)
                humidity = current.get("relative_humidity_2m", 60)
                wind = current.get("wind_speed_10m", 10.0)
                
                rain_probs = hourly.get("precipitation_probability", [10])
                rain_prob = rain_probs[0] if rain_probs else 10

                weather_info["temperature_c"] = round(temp, 1)
                weather_info["humidity_pct"] = int(humidity)
                weather_info["wind_speed_kmh"] = round(wind, 1)
                weather_info["rain_prob_pct"] = int(rain_prob)

                # Agricultural feasibility evaluation rules:
                if rain_prob > 50:
                    weather_info["is_spray_feasible"] = False
                    weather_info["feasibility_badge"] = "UNFEASIBLE (తగదు - వర్ష సూచన)"
                    weather_info["advisory_te"] = "రాబోయే కొన్ని గంటల్లో వర్షం పడే అవకాశం ఉంది. మందు వర్షపు నీటిలో కొట్టుకుపోయే ప్రమాదం ఉన్నందున పిచికారీ వాయిదా వేయండి."
                    weather_info["advisory_en"] = "High probability of rain. Postpone spraying as agrochemicals may wash off."
                elif wind > 18.0:
                    weather_info["is_spray_feasible"] = False
                    weather_info["feasibility_badge"] = "HIGH DRIFT RISK (గాలి వేగం ఎక్కువ)"
                    weather_info["advisory_te"] = f"గాలి వేగం {wind} km/h గా ఉంది. మందు ఇతర పొలాల్లోకి లేదా గాలిలోకి కొట్టుకుపోయే ప్రమాదం (Spray Drift) ఉంది. గాలి తగ్గే వరకు ఆగండి."
                    weather_info["advisory_en"] = f"Wind speed is {wind} km/h (exceeds 18 km/h limit). Spray drift hazard; wait for calm conditions."
                elif temp > 36.0:
                    weather_info["is_spray_feasible"] = True
                    weather_info["feasibility_badge"] = "CAUTION (ఎండ తీవ్రత)"
                    weather_info["advisory_te"] = "తీవ్రమైన ఎండ వేడిమి ఉంది. ఉదయం 9 గంటల లోపు లేదా సాయంత్రం 4:30 తర్వాత మాత్రమే పిచికారీ చేయండి."
                    weather_info["advisory_en"] = "High ambient heat. Spray only in early morning or late afternoon to avoid scorching."
                else:
                    weather_info["is_spray_feasible"] = True
                    weather_info["feasibility_badge"] = "OPTIMAL (అనుకూల సమయం)"
                    weather_info["advisory_te"] = "వాతావరణం పిచికారీకి అత్యంత అనుకూలంగా ఉంది. సరైన రక్షణ దుస్తులు ధరించి పిచికారీ చేయండి."
                    weather_info["advisory_en"] = "Weather is optimal for fertilizer and pesticide application."
        except Exception as e:
            logger.warning(f"Live weather fetch failed, using fallback: {e}")

        return weather_info

mandi_service = MandiService()

