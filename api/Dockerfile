FROM ypcs/debian:buster

ARG APT_PROXY

RUN /usr/lib/docker-helpers/apt-setup && \
    /usr/lib/docker-helpers/apt-upgrade && \
    apt-get --assume-yes install \
        default-libmysqlclient-dev \
        entr \
        procps \
        python3 \
        python3-flask \
        python3-flask-restful \
        python3-flask-sqlalchemy \
        python3-mysqldb \
        python3-requests \
        uwsgi \
        uwsgi-plugin-python3 && \
    /usr/lib/docker-helpers/apt-cleanup

ENV USER covidapp
ENV APPDIR /app

RUN adduser --system --disabled-password --group --gecos "${USER},,," "${USER}"
RUN mkdir -p "${APPDIR}" && \
    chown -R "${USER}:${USER}" "${APPDIR}"

# Environment to start with
WORKDIR $APPDIR
USER $USER
ENTRYPOINT ["/app/entrypoint.sh"]
