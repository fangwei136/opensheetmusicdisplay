import Vex from "vexflow";
import {GraphicalNote} from "../GraphicalNote";
import {Note} from "../../VoiceData/Note";
import {ClefInstruction} from "../../VoiceData/Instructions/ClefInstruction";
import {VexFlowConverter} from "./VexFlowConverter";
import {Pitch} from "../../../Common/DataObjects/Pitch";
import {Fraction} from "../../../Common/DataObjects/Fraction";
import {OctaveEnum, OctaveShift} from "../../VoiceData/Expressions/ContinuousExpressions/OctaveShift";
import { GraphicalVoiceEntry } from "../GraphicalVoiceEntry";
import { KeyInstruction } from "../../VoiceData/Instructions/KeyInstruction";
import { EngravingRules } from "../EngravingRules";

/**
 * The VexFlow version of a [[GraphicalNote]].
 */
export class VexFlowGraphicalNote extends GraphicalNote {
    constructor(note: Note, parent: GraphicalVoiceEntry, activeClef: ClefInstruction,
                octaveShift: OctaveEnum = OctaveEnum.NONE, rules: EngravingRules,
                graphicalNoteLength: Fraction = undefined) {
        super(note, parent, rules, graphicalNoteLength);
        this.clef = activeClef;
        this.octaveShift = octaveShift;
        if (note.Pitch) {
            // TODO: Maybe shift to Transpose function when available
            const drawPitch: Pitch = note.isRest() ? note.Pitch : OctaveShift.getPitchFromOctaveShift(note.Pitch, octaveShift);
            this.vfpitch = VexFlowConverter.pitch(drawPitch, note.isRest(), this.clef, this.sourceNote.Notehead);
            this.vfpitch[1] = undefined;
        }
    }

    public octaveShift: OctaveEnum;
    // The pitch of this note as given by VexFlowConverter.pitch
    public vfpitch: [string, string, ClefInstruction];
    // The corresponding VexFlow StaveNote (plus its index in the chord)
    public vfnote: [Vex.Flow.StemmableNote, number];
    public vfnoteIndex: number;
    // The current clef
    private clef: ClefInstruction;

    /**
     * Update the pitch of this note. Necessary in order to display accidentals correctly.
     * This is called by VexFlowGraphicalSymbolFactory.addGraphicalAccidental.
     * @param pitch
     */
    public setAccidental(pitch: Pitch): void {
        // if (this.vfnote) {
        //     let pitchAcc: AccidentalEnum = pitch.Accidental;
        //     const acc: string = Pitch.accidentalVexflow(pitch.Accidental);
        //     if (acc) {
        //         alert(acc);
        //         this.vfnote[0].addAccidental(this.vfnote[1], new Vex.Flow.Accidental(acc));
        //     }
        // } else {
        // revert octave shift, as the placement of the note is independent of octave brackets
        const drawPitch: Pitch = this.drawPitch(pitch);
        // recalculate the pitch, and this time don't ignore the accidental:
        this.vfpitch = VexFlowConverter.pitch(drawPitch, this.sourceNote.isRest(), this.clef, this.sourceNote.Notehead);
        this.DrawnAccidental = drawPitch.Accidental;
        //}
    }

    public drawPitch(pitch: Pitch): Pitch {
        return OctaveShift.getPitchFromOctaveShift(pitch, this.octaveShift);
    }

    public Transpose(keyInstruction: KeyInstruction, activeClef: ClefInstruction, halfTones: number, octaveEnum: OctaveEnum): Pitch {
        const tranposedPitch: Pitch = super.Transpose(keyInstruction, activeClef, halfTones, octaveEnum);
        const drawPitch: Pitch = OctaveShift.getPitchFromOctaveShift(tranposedPitch, this.octaveShift);
        this.vfpitch = VexFlowConverter.pitch(drawPitch, this.sourceNote.isRest(), this.clef, this.sourceNote.Notehead);
        this.vfpitch[1] = undefined;
        return drawPitch;
    }

    /**
     * Set the VexFlow StaveNote corresponding to this GraphicalNote, together with its index in the chord.
     * @param note
     * @param index
     */
    public setIndex(note: Vex.Flow.StemmableNote, index: number): void {
        this.vfnote = [note, index];
        this.vfnoteIndex = index;
    }

    public notehead(vfNote: Vex.Flow.StemmableNote = undefined): {line: number} {
        let vfnote: any = vfNote;
        if (!vfnote) {
            vfnote = (this.vfnote[0] as any);
        }
        const noteheads: any = vfnote.note_heads;
        if (noteheads && noteheads.length > this.vfnoteIndex && noteheads[this.vfnoteIndex]) {
            return vfnote.note_heads[this.vfnoteIndex];
        } else {
            return { line: 0 };
        }
    }

    /**
     * Gets the clef for this note
     */
    public Clef(): ClefInstruction {
        return this.clef;
    }

    /**
     * Gets the id of the SVGGElement containing this note, given the SVGRenderer is used.
     * This is for low-level rendering hacks and should be used with caution.
     */
    public getSVGId(): string {
        if (!this.vfnote) {
            return undefined; // e.g. MultiRestMeasure
        }
        return this.vfnote[0].getAttribute("id");
    }

    /**
     * Gets the SVGGElement containing this note, given the SVGRenderer is used.
     * This is for low-level rendering hacks and should be used with caution.
     */
    public getSVGGElement(): SVGGElement {
        if (!this.vfnote) {
            return undefined; // e.g. MultiRestMeasure
        }
        return this.vfnote[0].getAttribute("el");
    }

    /** Gets the SVG path element of the note's stem. */
    public getStemSVG(): HTMLElement {
        return document.getElementById("vf-" + this.getSVGId() + "-stem");
        // more correct, but Vex.Prefix() is not in the definitions:
        //return document.getElementById((Vex as any).Prefix(this.getSVGId() + "-stem"));
    }

    /** Gets the SVG path elements of the beams starting on this note. */
    public getBeamSVGs(): HTMLElement[] {
        const beamSVGs: HTMLElement[] = [];
        for (let i: number = 0;; i++) {
            const newSVG: HTMLElement = document.getElementById(`vf-${this.getSVGId()}-beam${i}`);
            if (!newSVG) {
                break;
            }
            beamSVGs.push(newSVG);
        }
        return beamSVGs;
    }
}
