import { FQueryBuilder } from './fquery';
import { fhelpers } from './fhelpers';
import { sentiwords } from '../util/sentiwords';
import { getReadabilityScores } from '../util/readability';

export const createDaysAndNights = function() {
  var runner = {};

  const h = fhelpers.fq;

  runner.run = function(tokens, stats_keep_last_scene_time) {
    var query = FQueryBuilder('label', {
      value: 0,
    });
    query.prepare(function(fq) {
      fq.recognized_scenes = 0;
    });
    query
      .count('value', h.has_scene_time('DAY'), 'DAY', true)
      .count('value', h.has_scene_time('NIGHT'), 'NIGHT', true)
      .count('value', h.has_scene_time('DUSK'), 'DUSK', true)
      .count('value', h.has_scene_time('DAWN'), 'DAWN', true);
    query.enter(h.is('scene_heading'), function(item, fq) {
      if (stats_keep_last_scene_time && fq.last_selection) {
        fq.last_selection.value++;
      }
    });
    query.exit(function(item, fq) {
      fq.recognized_scenes += item.value;
    });
    query.end(function(result, fq) {
      var all_scenes = FQueryBuilder()
        .count('scenes', h.is('scene_heading'))
        .run(fq.source).scenes;

      result.push({
        label: 'OTHER',
        value: all_scenes - fq.recognized_scenes,
      });
    });
    return query.run(tokens);
  };

  return runner;
};

export const createSceneLength = function() {
  const h = fhelpers.fq;

  var runner = {};
  runner.run = function(tokens, stats_keep_last_scene_time) {
    var query = FQueryBuilder('token', {
      length: 0,
    });
    query.prepare(function(fq) {
      fq.current_header = undefined;
    });
    query.enter(h.is('scene_heading'), function(token, fq) {
      fq.current_header = fq.select(token);
      fq.current_header.header = token.text;
      fq.current_header.location_type = token.location_type();
    });
    query.enter(true, function(item, fq) {
      if (fq.current_header) {
        fq.current_header.length += item.lines.length;
        if (fq.current_header.token.has_scene_time('DAY')) {
          fq.current_header.type = 'day';
        } else if (fq.current_header.token.has_scene_time('NIGHT')) {
          fq.current_header.type = 'night';
        } else {
          fq.current_header.type = fq.last_header_type || 'other';
        }
        fq.last_header_type = stats_keep_last_scene_time ? fq.current_header.type : undefined;
      }
    });
    return query.run(tokens);
  };
  return runner;
};

export const createIntAndExt = function() {
  const h = fhelpers.fq;

  var query = FQueryBuilder('label', { value: 0 });
  query.prepare(function(fq) {
    fq.recognized_scenes = 0;
  });
  query.enter(h.is('scene_heading'), function(item, fq) {
    fq.select(item.location_type()).value++;
  });
  return query;
};

export const createCharacters = function() {
  const h = fhelpers.fq;
  var runner = {};
  runner.run = function(tokens, basics, config) {
    var characters_query = FQueryBuilder('name', {
      nof_scenes: 0,
      lines: 0,
    });
    characters_query.enter(h.is('scene_heading'), function(item, fq) {
      fq.current_scene = item;
    });
    characters_query.enter(h.is('character'), function(item, fq) {
      var selector = fq.select(item.name());
      fq.current_character = selector;
      selector.scenes = selector.scenes || [];
      selector.scenes.indexOf(fq.current_scene) === -1 && selector.scenes.push(fq.current_scene);
      selector.nof_scenes = selector.scenes.length;
    });
    characters_query.enter(h.is_dialogue(), function(item, fq) {
      fq.current_character.lines += item.lines.length;
    });
    characters_query.exit(function(selection) {
      selection.time = (selection.lines / basics.dialogue_lines) * basics.dialogue_time;
    });
    var list = characters_query.run(tokens, config);
    apply_character_levels(list.concat(), basics);
    return list;
  };
  return runner;
};

export const createLocations = function() {
  const h = fhelpers.fq;

  var query = FQueryBuilder(
    'name',
    {
      count: 0,
    },
    {
      sort_by: 'count',
    }
  );
  query.enter(h.is('scene_heading'), function(item, fq) {
    fq.select(item.location()).count++;
  });
  return query;
};

const apply_character_levels = function(plan, basics) {
  plan.sort(function(a, b) {
    return b.nof_scenes - a.nof_scenes;
  });

  var level = 1,
    prev,
    post,
    prev_top = 0;

  var level_value = function(character) {
    return (character.nof_scenes * character.lines) / basics.dialogue_lines;
  };

  if (plan.length > 0) {
    plan[0].level = 1;
    for (var i = 1; i < plan.length; i++) {
      if (i === plan.length - 1) {
        plan[i].level = level;
      } else {
        prev = level_value(plan[i]) / level_value(plan[prev_top]);
        post = level_value(plan[i + 1]) / level_value(plan[i]);
        if (post > prev && level < 3) {
          level++;
          prev_top = i;
        }
        plan[i].level = level;
      }
    }
  }
};

export function getBasicStats(print) {
  const h = fhelpers.fq;

  var basic = FQueryBuilder(null, {
    last_page_lines: 0,
    scenes: 0,
    pages: 0,
    filled_pages: 0,
    action_lines: 0,
    dialogue_lines: 0,
    action_scenes: 0,
    dialogue_scenes: 0,
  });
  basic.prepare(function(fq) {
    fq.current_scene_heading_token = null;
    fq.dialogue_in_the_scene = false;
  });
  basic.count('action_lines', h.is('action', 'scene_heading', 'shot'));
  basic.count('dialogue_lines', h.is_dialogue());
  basic.count('pages', h.is('page_break'));
  basic.enter(h.is_dialogue(), function(item, fq) {
    fq.dialogue_in_the_scene = true;
  });
  basic.enter(h.is('scene_heading'), function(item, fq) {
    if (fq.current_scene_heading_token !== item.token) {
      fq.select().scenes++;
      fq.current_scene_heading_token = item.token;
      if (fq.select().scenes > 1) {
        if (fq.dialogue_in_the_scene) {
          fq.select().dialogue_scenes += 1;
        } else {
          fq.select().action_scenes += 1;
        }
        fq.dialogue_in_the_scene = false;
      }
    }
  });
  basic.enter(true, function(item, fq) {
    var selector = fq.select();
    if (item.is('page_break')) {
      selector.filled_pages += (selector.last_page_lines + 1) / print.lines_per_page;
      selector.last_page_lines = 0;
    } else {
      selector.last_page_lines++;
    }
  });
  basic.exit(function(item, fq) {
    // last scene
    if (fq.dialogue_in_the_scene) {
      fq.select().dialogue_scenes++;
    } else {
      fq.select().action_scenes++;
    }

    var all = item.action_lines + item.dialogue_lines;
    item.pages = item.pages + item.last_page_lines / print.lines_per_page;
    item.filled_pages += item.last_page_lines / print.lines_per_page;
    item.action_time = (item.action_lines / all) * item.filled_pages;
    item.dialogue_time = (item.dialogue_lines / all) * item.filled_pages;
  });
  basic.end(function(result) {
    if (result.length === 0) {
      result.push({
        pages: 0.0,
        filled_pages: 0.0,
        scenes: 0,
        action_time: 0.0,
        dialogue_time: 0.0,
        dialogue_lines: 0,
        characters: [],
        locations: [],
      });
    }
  });

  return basic;
}

export const createWhoWithWhom = function() {
  const h = fhelpers.fq;

  var runner = {};
  runner.run = function(tokens, basics, max) {
    max = max || 10;
    var top_characters = createCharacters()
      .run(tokens, basics, {
        sort_by: 'nof_scenes',
      })
      .splice(0, max);
    top_characters.sort(function(a, b) {
      return a.name > b.name ? 1 : -1;
    });
    var top_index = {};
    top_characters.forEach(function(character, index) {
      top_index[character.name] = index;
    });

    // characters in scene
    var characters_in_scene = FQueryBuilder('scene');
    characters_in_scene.enter(h.is('scene_heading'), function(item, fq) {
      fq.current_scene = item;
    });
    characters_in_scene.enter(h.is('character'), function(item, fq) {
      var selector = fq.select(fq.current_scene);
      selector.characters = selector.characters || [];
      selector.characters.indexOf(item.name()) === -1 &&
        top_index[item.name()] !== undefined &&
        selector.characters.push(item.name());
    });
    var characters_by_scene = characters_in_scene.run(tokens);
    var links_query = FQueryBuilder('link_id', {
      scenes: 0,
    });
    links_query.enter(true, function(item, fq) {
      var perms = helper.pairs(item.characters);
      perms.each(function(a, b) {
        a = top_index[a];
        b = top_index[b];
        var selector = fq.select(helper.double_id(a, b));
        selector.from = a;
        selector.to = b;
        selector.scenes++;
      });
    });
    var result = {
      characters: top_characters,
      links: links_query.run(characters_by_scene),
    };
    return result;
  };
  return runner;
};

export const createTempo = function() {
  const h = fhelpers.fq;

  var runner = {};
  runner.run = function(tokens) {
    var query = FQueryBuilder('scene_number');
    query.prepare(function(fq) {
      fq.current_scene_number = 0;
      fq.current_scene = null;
      fq.total_lines = 0;
    });
    query.enter(h.is('scene_heading'), function(item, fq) {
      fq.current_scene_number++;
      fq.current_scene = item;
      var selector = fq.select(fq.current_scene_number);
      selector.blocks = [];
      selector.lines = 0;
      selector.scene_heading = item.text;
    });
    query.enter(h.is('action', 'dialogue'), function(item, fq) {
      if (fq.current_scene_number) {
        var selector = fq.select(fq.current_scene_number);
        var total = item.lines.length;
        selector.blocks.push({
          token: item,
          lines: total,
        });
        selector.lines += total;
        fq.total_lines += total;
      }
    });
    query.exit(function(item) {
      item.avg_lines_per_block = item.lines / item.blocks.length;
      item.blocks.forEach(function(block) {
        block.line_tempo_change = (item.avg_lines_per_block - block.lines) / block.lines;
      });
    });
    query.end(function(result, fq) {
      result = result.filter(function(scene) {
        return scene.lines > 0;
      });
      fq.avg_lines_per_scene = fq.total_lines / result.length;
      result.forEach(function(scene) {
        scene.line_tempo_change = (fq.avg_lines_per_scene - scene.lines) / scene.lines;
      });
    });

    var scenes = query.run(tokens);

    var scenes_weight = scenes.length / 10;
    var result = [
      {
        line: '',
        scene: '',
        tempo: 0,
      },
    ];
    var current_tempo = 0;
    var max = -Infinity,
      min = Infinity;
    scenes.forEach(function(scene) {
      scene.blocks.forEach(function(block) {
        current_tempo *= 0.9;
        block.token.lines.forEach(function(line) {
          current_tempo *= 0.9;
          current_tempo += scenes_weight * scene.line_tempo_change + block.line_tempo_change;
          result.push({
            scene: scene.scene_heading,
            line: line.text,
            line_no: line.token.line,
            tempo: parseFloat(current_tempo.toFixed(2)),
          });
          if (current_tempo < min) {
            min = current_tempo;
          }
          if (current_tempo > max) {
            max = current_tempo;
          }
        });
      });
    });
    result.push({
      line: '',
      scene: '',
      tempo: 0,
    });

    return result;
  };

  return runner;
};

export const createTextAnalysis = function() {
  const h = fhelpers.fq;

  var words = {};
  sentiwords
    .split('\n')
    .filter(line => {
      return line.trim() && !line.startsWith('#');
    })
    .map(line => {
      var [word, score] = line.split(',');
      words[word] = parseFloat(score);
    });

  var query = FQueryBuilder(undefined, { action: '', dialogue: '', all: '' });
  query.enter(h.is('action'), function(item, fq) {
    fq.select().action += item.text;
    fq.select().all += item.text;
  });
  query.enter(h.is('character'), function(item, fq) {
    var characterName = item.name();
    fq.select()._current = characterName;
    fq.select()[characterName] = fq.select()[characterName] || '';
  });
  query.enter(h.is('dialogue'), function(item, fq) {
    var current = fq.select();
    current.dialogue += item.text + ' ';
    current.all += item.text + ' ';
    current[current._current] += item.text + ' ';
  });
  query.end(function(result, fq) {
    var result = fq.select();
    Object.keys(result).forEach(key => {
      if (result[key] && result[key].length > 0) {
        var r = {
          readability: getReadabilityScores(result[key]),
        };
        var score = 0;
        var items = [];
        result[key].split(' ').forEach(word => {
          word = word
            .trim()
            .replace('.', '')
            .replace(',', '');
          if (words[word]) {
            score += words[word];
            items.push([word, words[word]]);
          }
          r.sentiment = { score: items.length ? score / items.length : 0, items: items };
        });
        result[key] = r;
      } else {
        delete result[key];
      }
    });
  });
  return query;
};

let helper = {};
helper.pairs = function(t) {
  var result = t
    .map(function(item, index) {
      return t.slice(index + 1).map(function(i) {
        return [t[index], i];
      });
    })
    .reduce(function(prev, cur) {
      return prev.concat(cur);
    }, []);
  result.each = function(handler) {
    result.forEach(function(p) {
      handler(p[0], p[1]);
    });
  };
  return result;
};
helper.double_id = function(a, b) {
  return Math.min(a, b) + '_' + Math.max(a, b);
};
