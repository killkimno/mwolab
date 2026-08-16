import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "extract_mwo_data.py"
SPEC = importlib.util.spec_from_file_location("extract_mwo_data", MODULE_PATH)
EXTRACTOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACTOR)


class FakeGameData:
    def __init__(self, files):
        self.files = files

    def namelist(self):
        return list(self.files)

    def read(self, name):
        return self.files[name]


def loadout_xml(omnipod=None):
    omnipod_attribute = "" if omnipod is None else f' OmniPod="{omnipod}"'
    return f"""
        <Loadout MechID="3683" Public="1" Name="VIPER VPR-SC">
          <ComponentList>
            <component Name="centre_torso" Armor="46"{omnipod_attribute} />
          </ComponentList>
        </Loadout>
    """.encode()


def definitions(omnipod=None):
    component = {"name": "centre_torso"}
    if omnipod is not None:
        component["omnipod"] = omnipod
    return {
        "vpr-sc": {
            "stats": {"Variant": "VPR-SC", "VariantType": "Hero"},
            "components": {"centre_torso": component},
        }
    }


class ExtractMwoDataTests(unittest.TestCase):
    def parse_loadout(self, loadout_omnipod=None, mdf_omnipod=None):
        game_data = FakeGameData({
            "Libs/MechLoadout/vpr-sc.xml": loadout_xml(loadout_omnipod),
        })
        mechs = {
            "3683": {
                "id": 3683,
                "name": "vpr-sc",
                "chassis": "viper",
            }
        }
        return EXTRACTOR.parse_loadouts(
            game_data,
            mechs,
            definitions(mdf_omnipod),
            {},
            [],
        )["vpr-sc"]

    def test_parse_mdf_preserves_explicit_component_omnipod(self):
        data = b"""
            <Definition>
              <Mech Variant="VPR-SC" VariantType="Hero" />
              <ComponentList>
                <Component Name="centre_torso" Slots="12" HP="24" OmniPod="31402" />
              </ComponentList>
            </Definition>
        """
        definition, _ = EXTRACTOR.parse_mdf(data, "vpr-sc.mdf", {}, {})
        self.assertEqual(definition["components"]["centre_torso"]["omnipod"], 31402)

    def test_loadout_uses_mdf_omnipod_when_xml_omits_it(self):
        loadout = self.parse_loadout(mdf_omnipod=31402)
        self.assertEqual(loadout["components"]["centre_torso"]["omnipod"], 31402)

    def test_matching_explicit_omnipods_are_accepted(self):
        loadout = self.parse_loadout(loadout_omnipod=31402, mdf_omnipod=31402)
        self.assertEqual(loadout["components"]["centre_torso"]["omnipod"], 31402)

    def test_loadout_value_is_preserved_when_mdf_omits_it(self):
        loadout = self.parse_loadout(loadout_omnipod=31402)
        self.assertEqual(loadout["components"]["centre_torso"]["omnipod"], 31402)

    def test_textual_none_is_treated_as_missing(self):
        loadout = self.parse_loadout(loadout_omnipod="none", mdf_omnipod=31402)
        self.assertEqual(loadout["components"]["centre_torso"]["omnipod"], 31402)

    def test_conflicting_explicit_omnipods_stop_extraction(self):
        with self.assertRaisesRegex(RuntimeError, "Conflicting explicit OmniPod IDs"):
            self.parse_loadout(loadout_omnipod=30483, mdf_omnipod=31433)

    def test_missing_loadout_body_component_stops_extraction(self):
        game_data = FakeGameData({
            "Libs/MechLoadout/vpr-sc.xml": (
                b'<Loadout MechID="3683" Public="1" Name="VIPER VPR-SC">'
                b"<ComponentList /></Loadout>"
            ),
        })
        mechs = {"3683": {"id": 3683, "name": "vpr-sc", "chassis": "viper"}}
        with self.assertRaisesRegex(RuntimeError, "omits MDF body components"):
            EXTRACTOR.parse_loadouts(
                game_data,
                mechs,
                definitions(31402),
                {},
                [],
            )

    def test_missing_mdf_definition_stops_extraction(self):
        game_data = FakeGameData({
            "Libs/MechLoadout/vpr-sc.xml": loadout_xml(),
        })
        mechs = {"3683": {"id": 3683, "name": "vpr-sc", "chassis": "viper"}}
        with self.assertRaisesRegex(RuntimeError, "has no parsed MDF definition"):
            EXTRACTOR.parse_loadouts(game_data, mechs, {}, {}, [])

    def test_loadout_omnipod_must_match_chassis_and_component(self):
        loadouts = {"vpr-sc": self.parse_loadout(mdf_omnipod=31402)}
        mechs = {"3683": {"name": "vpr-sc", "chassis": "viper"}}
        wrong_pods = {
            "31402": {
                "id": 31402,
                "chassis": "executioner",
                "component": "centre_torso",
            }
        }
        with self.assertRaisesRegex(RuntimeError, "does not match chassis/component"):
            EXTRACTOR.validate_loadout_omnipods(loadouts, mechs, wrong_pods)

    def test_partially_resolved_omnimech_stops_extraction(self):
        loadout = self.parse_loadout(mdf_omnipod=31402)
        loadout["components"]["head"] = {"omnipod": None, "items": []}
        loadouts = {"vpr-sc": loadout}
        mechs = {"3683": {"name": "vpr-sc", "chassis": "viper"}}
        pods = {
            "31402": {
                "id": 31402,
                "chassis": "viper",
                "component": "centre_torso",
            }
        }
        with self.assertRaisesRegex(RuntimeError, "unresolved OmniPods: head"):
            EXTRACTOR.validate_loadout_omnipods(loadouts, mechs, pods)

if __name__ == "__main__":
    unittest.main()
