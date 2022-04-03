import { useState, useEffect } from "react";
import {
	Button,
	ImageBackground,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import React from "react";

//reference code: https://github.com/expo/examples/tree/master/with-sqlite

function openDatabase() {
	if (Platform.OS === "web") {
		return {
			transaction: () => {
				return {
					executeSql: () => {},
				};
			},
		};
	}

	const db = SQLite.openDatabase("db.db");
	return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem }) {
	const [items, setItems] = useState(null);

	useEffect(() => {
		db.transaction((tx) => {
			tx.executeSql(
				`select * from items where done = ?;`,
				[doneHeading ? 1 : 0],
				(_, { rows: { _array } }) => setItems(_array)
			);
		});
	}, []);

	const heading = doneHeading ? "Completed Tasks" : "Tasks";

	if (items === null || items.length === 0) {
		return null;
	}

	return (
		<View style={styles.sectionContainer}>
			<Text style={styles.sectionHeading}>{heading}</Text>
			{items.map(({ id, done, value }) => (
				<TouchableOpacity
					key={id}
					onPress={() => onPressItem && onPressItem(id)}
					style={{
						backgroundColor: done ? "#1c9963" : "#fff",
						borderColor: "#000",
						borderWidth: 1,
						padding: 8,
					}}
				>
					<Text style={{ color: done ? "#fff" : "#000" }}>{value}</Text>
				</TouchableOpacity>
			))}
		</View>
	);
}

export default function App() {
	const [text, setText] = useState(null);
	const [forceUpdate, forceUpdateId] = useForceUpdate();

	useEffect(() => {
		db.transaction((tx) => {
			tx.executeSql(
				"create table if not exists items (id integer primary key not null, done int, value text);"
			);
		});
	}, []);

	const add = (text) => {
		// is text empty?
		if (text === null || text === "") {
			return false;
		}

		db.transaction(
			(tx) => {
				tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
				tx.executeSql("select * from items", [], (_, { rows }) =>
					console.log(JSON.stringify(rows))
				);
			},
			null,
			forceUpdate
		);
	};

	return (
		<ImageBackground
			source={require("./assets/bk.png")}
			resizeMode="cover"
			style={{ flex: 1 }}
		>
			<View style={styles.container}>
				<Text style={styles.heading}>Todo List</Text>

				{Platform.OS === "web" ? (
					<View
						style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
					></View>
				) : (
					<>
						<View style={styles.flexRow}>
							<TextInput
								onChangeText={(text) => setText(text)}
								placeholder="add a task"
								style={styles.input}
								value={text}
							/>
							<View style={{ top: 22, left: -10 }}>
								<Button
									title="add task"
									color={"grey"}
									onPress={() => {
										add(text);
										setText(null);
									}}
								/>
							</View>
						</View>
						<ScrollView style={styles.listArea}>
							<Items
								key={`forceupdate-todo-${forceUpdateId}`}
								done={false}
								onPressItem={(id) =>
									db.transaction(
										(tx) => {
											tx.executeSql(`update items set done = 1 where id = ?;`, [
												id,
											]);
										},
										null,
										forceUpdate
									)
								}
							/>
							<Items
								done
								key={`forceupdate-done-${forceUpdateId}`}
								onPressItem={(id) =>
									db.transaction(
										(tx) => {
											tx.executeSql(`delete from items where id = ?;`, [id]);
										},
										null,
										forceUpdate
									)
								}
							/>
						</ScrollView>
					</>
				)}
			</View>
		</ImageBackground>
	);
}

function useForceUpdate() {
	const [value, setValue] = useState(0);
	return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: Constants.statusBarHeight,
	},
	heading: {
		fontSize: 25,
		textAlign: "center",
		color: "white",
		backgroundColor: "#23272A",
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	heading2: {
		fontSize: 16,
		textAlign: "center",
		color: "white",
		backgroundColor: "#23272A",
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	flexRow: {
		flexDirection: "row",
		backgroundColor: "#23272A",
	},
	input: {
		borderColor: "#4630eb",
		borderRadius: 20,
		borderWidth: 1,
		flex: 1,
		height: 48,
		margin: 16,
		padding: 8,
		backgroundColor: "white",
	},
	listArea: {
		flex: 1,
		paddingTop: 16,
		backgroundColor: "#23272A",
	},
	sectionContainer: {
		marginBottom: 16,
		marginHorizontal: 16,
		backgroundColor: "white",
	},
	sectionHeading: {
		fontSize: 18,
		marginBottom: 8,
		textAlign: "center",
		backgroundColor: "white",
	},
});
