import io
import wave
import math
import struct
import base64
import requests
import logging
from typing import Optional, Tuple
from config import settings

logger = logging.getLogger("voice_service")

class VoiceService:
    def __init__(self):
        self.sarvam_key = settings.SARVAM_API_KEY
        self.bhashini_key = settings.BHASHINI_API_KEY

    def speech_to_text(self, audio_bytes: bytes, filename: str = "audio.wav") -> Tuple[str, str]:
        """
        Transcribes Telugu audio to text using Sarvam AI STT or Bhashini.
        Falls back to intelligent mock transcript if API key is not configured.
        Returns: (transcript_text, provider_used)
        """
        # Try Sarvam AI STT if key is available
        if self.sarvam_key:
            try:
                headers = {
                    "api-subscription-key": self.sarvam_key
                }
                files = {
                    "file": (filename, audio_bytes, "audio/wav")
                }
                data = {
                    "model": "saaras:v1",
                    "language_code": "te-IN",
                    "with_diacritics": "true"
                }
                res = requests.post(settings.SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=15)
                if res.status_code == 200:
                    resp_json = res.json()
                    transcript = resp_json.get("transcript", "")
                    if transcript:
                        logger.info(f"Sarvam STT success: {transcript[:50]}")
                        return transcript, "sarvam"
                else:
                    logger.warning(f"Sarvam STT failed with status {res.status_code}: {res.text}")
            except Exception as e:
                logger.error(f"Error calling Sarvam STT: {e}")

        # Fallback STT: If no API key or API call failed, provide realistic simulation
        # Note: If audio bytes contain very little data or test audio, provide a default realistic farmer query
        logger.info("Using mock/offline Telugu STT fallback")
        mock_queries = [
            "నా పేరు కార్తీక్ తల్లూరి. నా వద్ద 4 ఎకరాల భూమి ఉంది. వరి పంటకు ఎంత యూరియా వేయాలి? మరియు PM-KISAN దరఖాస్తు చేయాలి.",
            "రైతు భరోసా పథకం అర్హతలు ఏమిటి? నాకు ఎకరానికి ఎంత సాయం అందుతుంది?",
            "గుంటూరు మార్కెట్లో మిర్చి ధర ఎంత ఉంది? ఈరోజు ఎకరానికి క్రిమిసంహారక మందు పిచికారీ చేయవచ్చా?",
            "వరి పంట 3 ఎకరాలకు డీఏపీ మరియు యూరియా మోతాదు తెలపండి."
        ]
        # Return the representative query for standard demo flow
        return mock_queries[0], "offline_mock"

    def text_to_speech(self, text_te: str) -> Tuple[Optional[str], str]:
        """
        Converts Telugu text to speech using Sarvam AI Bulbul TTS.
        Returns: (base64_audio_string, provider_used)
        """
        if self.sarvam_key and text_te:
            try:
                headers = {
                    "api-subscription-key": self.sarvam_key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "inputs": [text_te],
                    "target_language_code": "te-IN",
                    "speaker": "meera",
                    "pitch": 0,
                    "pace": 1.0,
                    "loudness": 1.2,
                    "speech_sample_rate": 16000,
                    "enable_preprocessing": True,
                    "model": "bulbul:v1"
                }
                res = requests.post(settings.SARVAM_TTS_URL, headers=headers, json=payload, timeout=15)
                if res.status_code == 200:
                    resp_json = res.json()
                    audios = resp_json.get("audios", [])
                    if audios and len(audios) > 0:
                        logger.info("Sarvam TTS generated successfully")
                        return audios[0], "sarvam"
                else:
                    logger.warning(f"Sarvam TTS failed ({res.status_code}): {res.text}")
            except Exception as e:
                logger.error(f"Error calling Sarvam TTS: {e}")

        # Fallback TTS: Generate a clean audio notification chime in base64 wav
        # Frontend also speaks text_te with browser Web Speech API (Telugu voice)
        fallback_wav = self._generate_chime_wav_base64()
        return fallback_wav, "browser_speech_with_chime"

    def _generate_chime_wav_base64(self) -> str:
        """
        Generates a pleasant 2-tone audio chime (440Hz -> 880Hz) in memory as WAV base64.
        Used as an instant audio cue when offline.
        """
        sample_rate = 16000
        duration_per_tone = 0.15
        num_samples = int(sample_rate * duration_per_tone)
        
        buffer = io.BytesIO()
        with wave.open(buffer, 'w') as wav_file:
            wav_file.setnchannels(1)        # Mono
            wav_file.setsampwidth(2)        # 16-bit
            wav_file.setframerate(sample_rate)
            
            # Tone 1: 523.25 Hz (C5)
            for i in range(num_samples):
                t = float(i) / sample_rate
                val = int(18000.0 * math.sin(2.0 * math.pi * 523.25 * t) * (1.0 - i/num_samples))
                wav_file.writeframes(struct.pack('<h', val))
                
            # Tone 2: 783.99 Hz (G5)
            for i in range(num_samples):
                t = float(i) / sample_rate
                val = int(22000.0 * math.sin(2.0 * math.pi * 783.99 * t) * (1.0 - i/num_samples))
                wav_file.writeframes(struct.pack('<h', val))
                
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')

voice_service = VoiceService()

