// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_dusty_manta.sql';
import m0001 from './0001_silly_silver_fox.sql';
import m0002 from './0002_swift_zemo.sql';
import m0003 from './0003_concerned_ultimo.sql';
import m0004 from './0004_fuzzy_killmonger.sql';
import m0005 from './0005_last_alex_wilder.sql';
import m0006 from './0006_meal_log_items.sql';
import m0007 from './0007_meal_log_item_extras.sql';
import m0008 from './0008_weigh_in_photo.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007,
m0008
    }
  }
  