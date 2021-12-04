import { theTrialOfTheChicago7 } from "./the-trial-of-the-chicago-7";
import { getPrintProfiles } from "./printProfile";
import { default as awParser } from 'aw-parser';
import { default as awLiner } from 'aw-liner';

export function parse() => {
  const screenplay = theTrialOfTheChicago7;
  console.log(awLiner);

  const config = {
    print_headers: true,
    print_actions: true,
    print_dialogues: true,
    print_notes: false,
    print_sections: false,
    print_synopsis: false,
    each_scene_on_new_page: false,
    double_space_between_scenes: false,
    use_dual_dialogue: true,
    merge_multiple_empty_lines: true,
  };
  const parsed = awParser.parser.parse(screenplay, config);
  const liner = new awLiner.Liner(awParser.helpers);

  const lines = liner.line(parsed.tokens, {
    print: getPrintProfiles().usletter,
    text_more: '(MORE)',
    text_contd: "(CONT'D)",
    split_dialogue: true,
  });

  return { tokens: parsed.tokens, lines: lines }
}
