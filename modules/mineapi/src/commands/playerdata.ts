// Import Types
import { Command } from "@spookelton/wrapperHelpers/types";

import { cleanNBT, readNbt } from "../lib/nbt";
import Players from "../lib/Players";
import { helpHelper, flatOut } from "@spookelton/wrapperHelpers/modul";
import { getWorldFolder } from "..";

export const playerdata: Command = async (message) => {
	const username = message.args[0];
	if (username === undefined) throw new Error("No username provided");
	const parsed = await readNbt(`${await getWorldFolder()}/playerdata/${await Players.getUUID(username)}.dat`);
	return flatOut(cleanNBT(parsed), `${username}.playerdata.json`);
};
playerdata.help = helpHelper({
	commandString: "~playerdata",
	summary: "Fetch playerdata for a given player.",
	exampleArgs: [["<username>"]],
});
