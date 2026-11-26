// The Alexa sounds that really play through Alexa Media Player on a real speaker (tried one by one, as the short id amzn_sfx_...).
// Taken from Amazon's Alexa Skills Kit sound library (ask-soundlibrary.json). Names and categories stay in English, as Amazon writes them.
// [id, name, category, seconds]
export const ALEXA_SOUNDS: ReadonlyArray<readonly [string, string, string, number]> = [
  ["amzn_sfx_scifi_alarm_01", "Scifi Alarm (1)", "Alarms/Alarm Sirens Scifi", 2.79],
  ["amzn_sfx_scifi_alarm_04", "Scifi Alarm (4)", "Alarms/Alarm Sirens Scifi", 4.49],
  ["amzn_sfx_doorbell_01", "Doorbell (1)", "Alarms/Chimes and Bells", 2.15],
  ["amzn_sfx_doorbell_chime_01", "Doorbell Chime (1)", "Alarms/Chimes and Bells", 2.15],
  ["amzn_sfx_doorbell_chime_02", "Doorbell Chime (2)", "Alarms/Chimes and Bells", 1.89],
  ["amzn_sfx_rooster_crow_01", "Rooster Crow (1)", "Animals/Birds", 2.47],
  ["amzn_sfx_cat_meow_1x_01", "Cat Meow 1x (1)", "Animals/Cat", 1.03],
  ["amzn_sfx_dog_med_bark_1x_02", "Dog Med Bark 1x (2)", "Animals/Dog", 0.81],
  ["amzn_sfx_lion_roar_02", "Lion Roar (2)", "Animals/Lion", 1.71],
  ["amzn_sfx_wolf_howl_02", "Wolf Howl (2)", "Animals/Wolf", 2.07],
  ["amzn_sfx_church_bell_1x_02", "Church Bell 1x (2)", "Bell/Church", 2.11],
  ["amzn_sfx_crowd_applause_01", "Crowd Applause (1)", "Voices/Crowds", 2.15],
  ["amzn_sfx_large_crowd_cheer_01", "Large Crowd Cheer (1)", "Voices/Crowds", 2.11],
];
