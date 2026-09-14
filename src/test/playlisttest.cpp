#include <gtest/gtest.h>

#include <QDataStream>
#include <QDebug>
#include <QTemporaryFile>
#include <QUrl>
#include <QtGlobal>
#include <algorithm>
#include <array>

#include "library/dao/playlistdao.h"
#include "test/mixxxdbtest.h"

#include "library/parser.h"
#include "library/parsercsv.h"
#include "library/parserm3u.h"
#include "library/parserpls.h"

class DummyParser : public Parser {
  public:
    QString playlistEntryToFilePath(
            const QString& playlistEntry,
            const QString& basePath = QString()) {
        const auto fileInfo = Parser::playlistEntryToFileInfo(playlistEntry, basePath);
        // Return the plain, literal file path, because the location
        // is undefined if relative paths.
        return fileInfo.asQFileInfo().filePath();
    }
};

class PlaylistTest : public testing::Test {};

// Autonomously AI-generated native regression tests at the user's request.
class PlaylistReorderTest : public MixxxDbTest {
  protected:
    PlaylistReorderTest()
            : MixxxDbTest(true) {
    }

    void SetUp() override {
        QSqlQuery query(dbConnection());
        ASSERT_TRUE(query.exec("CREATE TABLE Playlists (id INTEGER PRIMARY KEY, locked INTEGER)"));
        ASSERT_TRUE(query.exec("INSERT INTO Playlists VALUES (1,0)"));
        ASSERT_TRUE(query.exec("CREATE TABLE PlaylistTracks (id INTEGER PRIMARY KEY, "
                               "playlist_id INTEGER, track_id INTEGER, position INTEGER, "
                               "pl_datetime_added TEXT)"));
        dao.initialize(dbConnection());
    }

    void seed(const std::array<int, 3>& tracks) {
        QSqlQuery query(dbConnection());
        ASSERT_TRUE(query.exec("DELETE FROM PlaylistTracks"));
        for (int i = 0; i < 3; ++i) {
            query.prepare("INSERT INTO PlaylistTracks VALUES (?,1,?,?,?)");
            query.addBindValue(i + 1);
            query.addBindValue(tracks[i]);
            query.addBindValue(i + 1);
            query.addBindValue(QString::number(i + 10));
            ASSERT_TRUE(query.exec());
        }
    }

    void expectOrder(const std::array<int, 3>& order, const std::array<int, 3>& tracks) {
        QSqlQuery query(dbConnection());
        ASSERT_TRUE(query.exec("SELECT id,track_id,position,pl_datetime_added "
                               "FROM PlaylistTracks ORDER BY position,id"));
        for (int i = 0; i < 3; ++i) {
            ASSERT_TRUE(query.next());
            EXPECT_EQ(query.value(0).toInt(), order[i]);
            EXPECT_EQ(query.value(1).toInt(), tracks[order[i] - 1]);
            EXPECT_EQ(query.value(2).toInt(), i + 1);
            EXPECT_EQ(query.value(3).toString(), QString::number(order[i] + 9));
        }
        EXPECT_FALSE(query.next());
    }

    PlaylistDAO dao;
};

TEST_F(PlaylistReorderTest, EveryThreeEntryPermutationPreservesOccurrences) {
    for (const auto& tracks : {std::array<int, 3>{101, 202, 303},
                 std::array<int, 3>{101, 202, 101}, std::array<int, 3>{101, 101, 101}}) {
        std::array<int, 3> order{1, 2, 3};
        do {
            seed(tracks);
            QList<std::pair<TrackId, int>> requested;
            for (int row : order) {
                requested.append({TrackId(QVariant(tracks[row - 1])), row});
            }
            dao.orderTracksByCurrPos(1, requested);
            expectOrder(order, tracks);
        } while (std::next_permutation(order.begin(), order.end()));
    }
}

TEST_F(PlaylistReorderTest, InvalidOccurrenceReferencesLeavePlaylistUnchanged) {
    int notifications = 0;
    QObject::connect(&dao, &PlaylistDAO::tracksMoved, [&notifications] { ++notifications; });
    const std::array<int, 3> tracks{101, 202, 101};
    for (auto requested : {QList<std::pair<TrackId, int>>{{TrackId(QVariant(101)), 3}, {TrackId(QVariant(202)), 2}, {TrackId(QVariant(101)), 3}},
                 QList<std::pair<TrackId, int>>{{TrackId(QVariant(101)), 3}, {TrackId(QVariant(999)), 2}, {TrackId(QVariant(101)), 1}},
                 QList<std::pair<TrackId, int>>{{TrackId(QVariant(101)), 3}, {TrackId(QVariant(202)), 4}, {TrackId(QVariant(101)), 1}}}) {
        seed(tracks);
        dao.orderTracksByCurrPos(1, requested);
        expectOrder({1, 2, 3}, tracks);
        EXPECT_EQ(notifications, 0);
    }
}

TEST_F(PlaylistReorderTest, LockedPlaylistAndFailedWriteRemainUnchanged) {
    const std::array<int, 3> tracks{101, 202, 101};
    seed(tracks);
    QList<std::pair<TrackId, int>> requested{{TrackId(QVariant(101)), 3}, {TrackId(QVariant(202)), 2}, {TrackId(QVariant(101)), 1}};
    QSqlQuery query(dbConnection());
    ASSERT_TRUE(query.exec("UPDATE Playlists SET locked=1"));
    dao.orderTracksByCurrPos(1, requested);
    expectOrder({1, 2, 3}, tracks);
    ASSERT_TRUE(query.exec("UPDATE Playlists SET locked=0"));
    ASSERT_TRUE(query.exec("CREATE TRIGGER reject_second BEFORE UPDATE ON PlaylistTracks "
                          "WHEN OLD.id=2 BEGIN SELECT RAISE(ABORT,'test failure'); END"));
    dao.orderTracksByCurrPos(1, requested);
    expectOrder({1, 2, 3}, tracks);
}
TEST_F(PlaylistReorderTest, InvalidInputAndUnavailableTransactionDoNotWrite) {
    const std::array<int, 3> tracks{101, 202, 101};
    seed(tracks);
    QList<std::pair<TrackId, int>> requested{{TrackId(), 3},
            {TrackId(QVariant(202)), 2}, {TrackId(QVariant(101)), 1}};
    dao.orderTracksByCurrPos(1, requested);
    expectOrder({1, 2, 3}, tracks);
    requested[0].first = TrackId(QVariant(101));
    dao.orderTracksByCurrPos(999, requested);
    expectOrder({1, 2, 3}, tracks);
    ASSERT_TRUE(dbConnection().transaction());
    dao.orderTracksByCurrPos(1, requested);
    expectOrder({1, 2, 3}, tracks);
    ASSERT_TRUE(dbConnection().rollback());
    requested.removeLast();
    dao.orderTracksByCurrPos(1, requested);
    expectOrder({1, 2, 3}, tracks);
    requested.clear();
    dao.orderTracksByCurrPos(1, requested);
    expectOrder({1, 2, 3}, tracks);
}

class PlaylistRemovalTest : public PlaylistReorderTest {};

TEST_F(PlaylistRemovalTest, RemoveByTrackPreservesEveryUnrelatedOccurrence) {
    QSqlQuery query(dbConnection());
    ASSERT_TRUE(query.exec("ALTER TABLE Playlists ADD COLUMN hidden INTEGER DEFAULT 0"));
    for (int mask = 0; mask < 32; ++mask) {
        SCOPED_TRACE(mask);
        ASSERT_TRUE(query.exec("DELETE FROM PlaylistTracks"));
        QList<int> survivingIds;
        for (int i = 0; i < 5; ++i) {
            const int track = (mask & (1 << i)) ? 101 : 202;
            query.prepare("INSERT INTO PlaylistTracks VALUES (?,1,?,?,?)");
            query.addBindValue(i + 1);
            query.addBindValue(track);
            query.addBindValue(i + 1);
            query.addBindValue(QString::number(i + 10));
            ASSERT_TRUE(query.exec());
            if (track == 202) {
                survivingIds.append(i + 1);
            }
        }
        PlaylistDAO removalDao;
        removalDao.initialize(dbConnection());
        int removed = 0;
        QObject::connect(&removalDao, &PlaylistDAO::trackRemoved,
                [&removed](int playlist, TrackId track, int) {
                    EXPECT_EQ(playlist, 1);
                    EXPECT_EQ(track, TrackId(QVariant(101)));
                    ++removed;
                });
        removalDao.removeTracksFromPlaylistById(1, TrackId(QVariant(101)));
        ASSERT_TRUE(query.exec("SELECT id,track_id,position,pl_datetime_added "
                               "FROM PlaylistTracks ORDER BY position"));
        int position = 1;
        for (int id : survivingIds) {
            ASSERT_TRUE(query.next());
            EXPECT_EQ(query.value(0).toInt(), id);
            EXPECT_EQ(query.value(1).toInt(), 202);
            EXPECT_EQ(query.value(2).toInt(), position++);
            EXPECT_EQ(query.value(3).toString(), QString::number(id + 9));
        }
        EXPECT_FALSE(query.next());
        EXPECT_EQ(removed, 5 - survivingIds.size());
        EXPECT_FALSE(removalDao.isTrackInPlaylist(TrackId(QVariant(101)), 1));
        EXPECT_EQ(removalDao.isTrackInPlaylist(TrackId(QVariant(202)), 1), !survivingIds.empty());
    }
}

TEST_F(PlaylistRemovalTest, SingleOccurrenceRemovalKeepsSurvivingMembership) {
    QSqlQuery query(dbConnection());
    ASSERT_TRUE(query.exec("ALTER TABLE Playlists ADD COLUMN hidden INTEGER DEFAULT 0"));
    const TrackId a(QVariant(101)), b(QVariant(202));
    ASSERT_TRUE(dao.appendTracksToPlaylist({a,b,a}, 1));
    dao.removeTrackFromPlaylist(1, 1);
    EXPECT_TRUE(dao.isTrackInPlaylist(a, 1));
    EXPECT_TRUE(dao.isTrackInPlaylist(b, 1));
    EXPECT_EQ(dao.getTrackIdsInPlaylistOrder(1), QList<TrackId>({b,a}));
    dao.removeTrackFromPlaylist(1, 2);
    EXPECT_FALSE(dao.isTrackInPlaylist(a, 1));
    EXPECT_TRUE(dao.isTrackInPlaylist(b, 1));
}

TEST_F(PlaylistRemovalTest, RemoveByTrackDoesNotChangeOtherPlaylist) {
    QSqlQuery query(dbConnection());
    ASSERT_TRUE(query.exec("ALTER TABLE Playlists ADD COLUMN hidden INTEGER DEFAULT 0"));
    ASSERT_TRUE(query.exec("INSERT INTO Playlists VALUES (2,0,0)"));
    const TrackId a(QVariant(101)), b(QVariant(202));
    ASSERT_TRUE(dao.appendTracksToPlaylist({a,a,b}, 1));
    ASSERT_TRUE(dao.appendTracksToPlaylist({a,b,a}, 2));
    dao.removeTracksFromPlaylistById(1, a);
    EXPECT_EQ(dao.getTrackIdsInPlaylistOrder(1), QList<TrackId>({b}));
    EXPECT_EQ(dao.getTrackIdsInPlaylistOrder(2), QList<TrackId>({a,b,a}));
    EXPECT_TRUE(dao.isTrackInPlaylist(a, 2));
    EXPECT_FALSE(dao.isTrackInPlaylist(a, 1));
}
// End of autonomously AI-generated native regression tests.

TEST_F(PlaylistTest, IsPlaylistFilenameSupported) {
    EXPECT_TRUE(ParserCsv::isPlaylistFilenameSupported("test.csv"));
    EXPECT_FALSE(ParserCsv::isPlaylistFilenameSupported("test.mp3"));
}

TEST_F(PlaylistTest, ParseAllLocations) {
    QTemporaryFile csvFile;
    ASSERT_TRUE(csvFile.open());
    csvFile.write("Location,OtherData\n");
    csvFile.write("/path/to/file1,/other/data\n");
    csvFile.write("/path/to/file2,/other/data\n");
    csvFile.close();

    QList<QString> locations = ParserCsv::parseAllLocations(csvFile.fileName());

    EXPECT_EQ(locations.size(), 2);
    EXPECT_EQ(locations[0], "/path/to/file1");
    EXPECT_EQ(locations[1], "/path/to/file2");
}

TEST_F(PlaylistTest, ParseEmptyFile) {
    QTemporaryFile csvFile;
    ASSERT_TRUE(csvFile.open());
    csvFile.close();

    const QList<QString> entries = ParserCsv().parseAllLocations(csvFile.fileName());

    // Check that the entries list is empty
    EXPECT_TRUE(entries.isEmpty());
}
TEST_F(PlaylistTest, ParseWithDifferentLocationColumnNamesAndFormats) {
    // Test with different location column named "Dateiname" instead of "Location"
    QStringList paths = {
            "C:\\path\\to\\file1",
            "%USERPROFILE%\\Music\\file2",
            "Music\\file3",
            "C:/path/to/file4",
            "/path/to/file5",
            "$HOME/Music/file6",
            "Music/file7",
            "\"Michael Jackson\"",
            "Michael Jackson"};

    for (const QString& path : paths) {
        QTemporaryFile csvFile;
        ASSERT_TRUE(csvFile.open());
        csvFile.write("Dateiname,OtherData\n");
        csvFile.write(path.toUtf8() + ",other-data\n");
        csvFile.close();

        const QList<QString> entries = ParserCsv().parseAllLocations(csvFile.fileName());

        // Check the contents of the entries list
#ifdef Q_OS_WIN
        // Note, that $HOME is not expanded on Windows, but legal path syntax
        if (path == "\"Michael Jackson\"" || path == "Michael Jackson") {
            // Check that the entries list is empty for invalid path syntax
            EXPECT_TRUE(entries.isEmpty());
        } else {
            // Check the size of the entries list
            EXPECT_EQ(entries.size(), 1);
            if (!entries.isEmpty()) {
                EXPECT_EQ(entries[0], path);
            }
        }
#else
        if (path == "C:\\path\\to\\file1" ||
                path == "%USERPROFILE%\\Music\\file2" ||
                path == "Music\\file3" || path == "\"Michael Jackson\"" ||
                path == "Michael Jackson") {
            // Check that the entries list is empty for invalid path syntax
            EXPECT_TRUE(entries.isEmpty());
        } else {
            // Check the size of the entries list
            EXPECT_EQ(entries.size(), 1);
            if (!entries.isEmpty()) {
                EXPECT_EQ(entries[0], path);
            }
        }
#endif
    }
}

TEST_F(PlaylistTest, ParseWithLocationColumn) {
    QTemporaryFile csvFile;
    ASSERT_TRUE(csvFile.open());
    csvFile.write("#,Location\n");
    csvFile.write("1,/path/to/file1\n");
    csvFile.write("2,/path/to/file2\n");
    csvFile.close();

    const QList<QString> entries = ParserCsv().parseAllLocations(csvFile.fileName());

    // Check the size of the entries list
    EXPECT_EQ(entries.size(), 2);

    // Check the contents of the entries list
    EXPECT_EQ(entries[0], "/path/to/file1");
    EXPECT_EQ(entries[1], "/path/to/file2");
}

TEST_F(PlaylistTest, Normalize) {
    DummyParser parser;

    EXPECT_EQ(QString("/foo/bar.mp3"),
            parser.playlistEntryToFilePath("file:///foo/bar.mp3"));
    EXPECT_EQ(QString("foo/bar.mp3"),
            parser.playlistEntryToFilePath("file:foo/bar.mp3"));
#ifdef _WIN32
    EXPECT_EQ(QString("c:/foo/bar.mp3"),
            parser.playlistEntryToFilePath("file:///c:/foo/bar.mp3"));
#else
    EXPECT_EQ(QString("/c:/foo/bar.mp3"),
            parser.playlistEntryToFilePath("file:///c:/foo/bar.mp3"));
#endif
    EXPECT_EQ(QString("/foo /bar.mp3"),
            parser.playlistEntryToFilePath("file:///foo%20/bar.mp3"));
    EXPECT_EQ(QString("c:/foo/bar.mp3"),
            parser.playlistEntryToFilePath("c:/foo/bar.mp3"));
    EXPECT_EQ(QString("c:/foo/bar.mp3"),
            parser.playlistEntryToFilePath("c:\\foo\\bar.mp3"));
}

TEST_F(PlaylistTest, Relative) {
    DummyParser parser;

    EXPECT_EQ(QString("../foo/bar.mp3"),
            parser.playlistEntryToFilePath("../foo/bar.mp3", ""));
    EXPECT_EQ(QString("base/folder/../foo/bar.mp3"),
            parser.playlistEntryToFilePath("../foo/bar.mp3", "base/folder"));
    EXPECT_EQ(QString("base/folder/../../bar.mp3"),
            parser.playlistEntryToFilePath("../../bar.mp3", "base/folder"));
}

TEST_F(PlaylistTest, M3uEndOfLine) {
    QTemporaryFile m3uFile;
    ASSERT_TRUE(m3uFile.open());
    m3uFile.write("crlf.mp3\r\n");
    m3uFile.write("cr.mp3\r");
    m3uFile.write("lf.mp3\n");
    // Check for Windows-1250 Euro Sign
    m3uFile.write("EuroSign\x80.mp3\n");
    m3uFile.write("end.mp3");
    m3uFile.close();

    const QList<QString> entries = ParserM3u().parseAllLocations(m3uFile.fileName());
    ASSERT_EQ(entries.size(), 5);
    EXPECT_TRUE(entries.at(0).endsWith(QStringLiteral("crlf.mp3")));
    EXPECT_TRUE(entries.at(1).endsWith(QStringLiteral("cr.mp3")));
    EXPECT_TRUE(entries.at(2).endsWith(QStringLiteral("lf.mp3")));
    EXPECT_TRUE(entries.at(3).endsWith(QStringLiteral("EuroSign\u20AC.mp3")));
    EXPECT_TRUE(entries.at(4).endsWith(QStringLiteral("end.mp3")));
}

TEST_F(PlaylistTest, CsvEndOfLine) {
    QTemporaryFile csvFile;
    ASSERT_TRUE(csvFile.open());
    csvFile.write("#,Location\r\n");
    csvFile.write("1,cr.mp3\r");
    csvFile.write("2,lf.mp3\n");
    csvFile.close();

    const QList<QString> entries = ParserCsv().parseAllLocations(csvFile.fileName());
    ASSERT_EQ(entries.size(), 2);
    EXPECT_TRUE(entries.at(0).endsWith(QStringLiteral("cr.mp3")));
    EXPECT_TRUE(entries.at(1).endsWith(QStringLiteral("lf.mp3")));
}

TEST_F(PlaylistTest, PlsEndOfLine) {
    QTemporaryFile plsFile;
    ASSERT_TRUE(plsFile.open());
    plsFile.write("[playlist]\n");
    plsFile.write("NumberOfEntries=2\r");
    plsFile.write("File0=cr.mp3\r");
    plsFile.write("File1=lf.mp3\n");
    plsFile.close();

    const QList<QString> entries = ParserPls().parseAllLocations(plsFile.fileName());
    ASSERT_EQ(entries.size(), 2);
    EXPECT_TRUE(entries.at(0).endsWith(QStringLiteral("cr.mp3")));
    EXPECT_TRUE(entries.at(1).endsWith(QStringLiteral("lf.mp3")));
}
